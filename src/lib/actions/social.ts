"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { publishPostToPlatform } from "@/lib/social"
import { revalidatePath } from "next/cache"
import { validate, socialPostCreateSchema } from "@/lib/validations"
import type { SocialPlatform, SocialPostStatus, SocialMediaType } from "@prisma/client"

// ─── ACCOUNTS ────────────────────────────────

export async function getSocialAccounts() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return db.socialAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function disconnectSocialAccount(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.socialAccount.update({ where: { id }, data: { isActive: false } })

  revalidatePath("/social")
  revalidatePath("/social/accounts")
}

export async function reconnectSocialAccount(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.socialAccount.update({ where: { id }, data: { isActive: true } })

  revalidatePath("/social/accounts")
}

// ─── POSTS ────────────────────────────────────

export async function getSocialPosts(params?: {
  status?: SocialPostStatus | "ALL"
  platform?: SocialPlatform
  page?: number
  limit?: number
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const limit = params?.limit ?? 20
  const page = params?.page ?? 1
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (params?.status && params.status !== "ALL") where.status = params.status
  if (params?.platform) {
    where.targets = { some: { account: { platform: params.platform } } }
  }

  const [posts, total] = await Promise.all([
    db.socialPost.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true } },
        targets: {
          include: {
            account: {
              select: {
                id: true,
                platform: true,
                accountName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.socialPost.count({ where }),
  ])

  return { posts, total, page, limit }
}

export async function createSocialPost(data: {
  caption: string
  mediaUrls: string[]
  mediaType: SocialMediaType
  accountIds: string[]
  scheduledAt?: string
  firstComment?: string
  tags?: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validated = validate(socialPostCreateSchema, data)
  const { caption, mediaUrls, mediaType, accountIds, scheduledAt, firstComment, tags } = validated

  const status: SocialPostStatus = scheduledAt ? "SCHEDULED" : "DRAFT"

  const post = await db.socialPost.create({
    data: {
      caption,
      mediaUrls,
      mediaType,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      firstComment: firstComment || null,
      tags: tags ?? [],
      createdById: session.user.id,
      targets: {
        create: accountIds.map((accountId) => ({ accountId, status })),
      },
    },
    include: { targets: { include: { account: true } } },
  })

  revalidatePath("/social")
  revalidatePath("/social/scheduled")
  return post
}

export async function updateSocialPost(
  id: string,
  data: {
    caption?: string
    mediaUrls?: string[]
    mediaType?: SocialMediaType
    scheduledAt?: string | null
    firstComment?: string
    tags?: string[]
    accountIds?: string[]
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await db.socialPost.findUnique({ where: { id } })
  if (!existing) throw new Error("Post not found")
  if (existing.status === "PUBLISHED" || existing.status === "PUBLISHING") {
    throw new Error("Cannot edit a published post")
  }

  const newStatus: SocialPostStatus =
    data.scheduledAt !== undefined
      ? data.scheduledAt
        ? "SCHEDULED"
        : "DRAFT"
      : existing.status

  await db.socialPost.update({
    where: { id },
    data: {
      ...(data.caption !== undefined && { caption: data.caption }),
      ...(data.mediaUrls !== undefined && { mediaUrls: data.mediaUrls }),
      ...(data.mediaType !== undefined && { mediaType: data.mediaType }),
      ...(data.scheduledAt !== undefined && {
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: newStatus,
      }),
      ...(data.firstComment !== undefined && { firstComment: data.firstComment }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  })

  if (data.accountIds) {
    await db.socialPostTarget.deleteMany({ where: { postId: id } })
    await db.socialPostTarget.createMany({
      data: data.accountIds.map((accountId) => ({
        postId: id,
        accountId,
        status: newStatus,
      })),
    })
  }

  revalidatePath("/social")
  revalidatePath("/social/scheduled")
}

export async function deleteSocialPost(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.socialPost.delete({ where: { id } })

  revalidatePath("/social")
  revalidatePath("/social/scheduled")
  revalidatePath("/social/analytics")
}

export async function publishSocialPost(id: string): Promise<{
  success: boolean
  partialSuccess: boolean
  failedPlatforms: string[]
}> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const post = await db.socialPost.findUnique({
    where: { id },
    include: { targets: { include: { account: true } } },
  })
  if (!post) throw new Error("Post not found")

  await db.socialPost.update({ where: { id }, data: { status: "PUBLISHING" } })

  const failedPlatforms: string[] = []

  await Promise.allSettled(
    post.targets.map(async (target) => {
      if (!target.account.isActive) return

      await db.socialPostTarget.update({
        where: { id: target.id },
        data: { status: "PUBLISHING" },
      })

      try {
        const result = await publishPostToPlatform(target.account, {
          caption: post.caption,
          mediaUrls: post.mediaUrls,
          mediaType: post.mediaType,
          firstComment: post.firstComment,
          tags: post.tags,
        })

        await db.socialPostTarget.update({
          where: { id: target.id },
          data: {
            status: "PUBLISHED",
            platformPostId: result.id,
            platformUrl: result.url,
            publishedAt: new Date(),
            errorMessage: null,
          },
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        failedPlatforms.push(`${target.account.platform}: ${msg}`)
        await db.socialPostTarget.update({
          where: { id: target.id },
          data: { status: "FAILED", errorMessage: msg },
        })
      }
    })
  )

  const targets = await db.socialPostTarget.findMany({ where: { postId: id } })
  const allPublished = targets.every((t) => t.status === "PUBLISHED")
  const anyPublished = targets.some((t) => t.status === "PUBLISHED")
  const finalStatus: SocialPostStatus = allPublished
    ? "PUBLISHED"
    : anyPublished
      ? "PARTIALLY_PUBLISHED"
      : "FAILED"

  await db.socialPost.update({
    where: { id },
    data: { status: finalStatus, publishedAt: anyPublished ? new Date() : null },
  })

  revalidatePath("/social")
  revalidatePath("/social/scheduled")
  revalidatePath("/social/analytics")

  return {
    success: allPublished,
    partialSuccess: anyPublished && !allPublished,
    failedPlatforms,
  }
}

// ─── STATS ────────────────────────────────────

export async function getSocialStats() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const [accounts, posts, scheduledCount, targets] = await Promise.all([
    db.socialAccount.findMany({ where: { isActive: true } }),
    db.socialPost.count(),
    db.socialPost.count({ where: { status: "SCHEDULED" } }),
    db.socialPostTarget.findMany({
      where: { status: "PUBLISHED" },
      select: { likes: true, comments: true, shares: true, impressions: true },
    }),
  ])

  const publishedCount = await db.socialPost.count({ where: { status: "PUBLISHED" } })
  const failedCount = await db.socialPost.count({
    where: { status: { in: ["FAILED", "PARTIALLY_PUBLISHED"] } },
  })

  const totalLikes = targets.reduce((s, t) => s + t.likes, 0)
  const totalComments = targets.reduce((s, t) => s + t.comments, 0)
  const totalShares = targets.reduce((s, t) => s + t.shares, 0)
  const totalImpressions = targets.reduce((s, t) => s + t.impressions, 0)

  const platformBreakdown = accounts.reduce(
    (acc, a) => {
      acc[a.platform] = (acc[a.platform] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    connectedAccounts: accounts.length,
    platformBreakdown,
    totalPosts: posts,
    publishedPosts: publishedCount,
    scheduledPosts: scheduledCount,
    failedPosts: failedCount,
    totalLikes,
    totalComments,
    totalShares,
    totalImpressions,
  }
}

export async function getScheduledPosts() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return db.socialPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
    include: {
      createdBy: { select: { name: true } },
      targets: {
        include: { account: { select: { id: true, platform: true, accountName: true } } },
      },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

export async function getRecentPosts(limit = 10) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return db.socialPost.findMany({
    where: { status: { in: ["PUBLISHED", "PARTIALLY_PUBLISHED", "FAILED"] } },
    include: {
      createdBy: { select: { name: true } },
      targets: {
        include: { account: { select: { id: true, platform: true, accountName: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  })
}

export async function getDraftPosts() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return db.socialPost.findMany({
    where: { status: "DRAFT" },
    include: {
      createdBy: { select: { name: true } },
      targets: {
        include: { account: { select: { id: true, platform: true, accountName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPostById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const post = await db.socialPost.findUnique({
    where: { id },
    include: {
      targets: {
        include: { account: { select: { id: true, platform: true, accountName: true, avatarUrl: true } } },
      },
    },
  })
  if (!post) throw new Error("Post not found")
  return post
}

export async function getPostsForCalendar(year: number, month: number) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  return db.socialPost.findMany({
    where: {
      OR: [
        { scheduledAt: { gte: start, lte: end } },
        { publishedAt: { gte: start, lte: end } },
        { createdAt: { gte: start, lte: end }, status: "DRAFT" },
      ],
    },
    include: {
      targets: {
        include: { account: { select: { id: true, platform: true, accountName: true } } },
      },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

export async function syncPostEngagement(postId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const targets = await db.socialPostTarget.findMany({
    where: { postId, status: "PUBLISHED", platformPostId: { not: null } },
    include: { account: true },
  })

  let synced = 0

  for (const target of targets) {
    try {
      let likes = 0, comments = 0, shares = 0, impressions = 0

      if (target.account.platform === "FACEBOOK" && target.platformPostId) {
        const token = target.account.accessToken
        const res = await fetch(
          `https://graph.facebook.com/v21.0/${target.platformPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`
        )
        if (res.ok) {
          const data = await res.json()
          likes = data.likes?.summary?.total_count ?? 0
          comments = data.comments?.summary?.total_count ?? 0
          shares = data.shares?.count ?? 0
        }
      } else if (target.account.platform === "TWITTER" && target.platformPostId) {
        const token = target.account.accessToken
        const res = await fetch(
          `https://api.twitter.com/2/tweets/${target.platformPostId}?tweet.fields=public_metrics`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (res.ok) {
          const data = await res.json()
          const m = data.data?.public_metrics
          likes = m?.like_count ?? 0
          comments = m?.reply_count ?? 0
          shares = m?.retweet_count ?? 0
          impressions = m?.impression_count ?? 0
        }
      } else if (target.account.platform === "LINKEDIN" && target.platformPostId) {
        const token = target.account.accessToken
        const [likesRes, commentsRes] = await Promise.all([
          fetch(`https://api.linkedin.com/rest/reactions/${encodeURIComponent(target.platformPostId)}?count=1`, {
            headers: { Authorization: `Bearer ${token}`, "LinkedIn-Version": "202411" },
          }),
          fetch(`https://api.linkedin.com/rest/comments?count=1&post=${encodeURIComponent(target.platformPostId)}`, {
            headers: { Authorization: `Bearer ${token}`, "LinkedIn-Version": "202411" },
          }),
        ])
        if (likesRes.ok) {
          const data = await likesRes.json()
          likes = data.paging?.total ?? 0
        }
        if (commentsRes.ok) {
          const data = await commentsRes.json()
          comments = data.paging?.total ?? 0
        }
      }

      await db.socialPostTarget.update({
        where: { id: target.id },
        data: { likes, comments, shares, impressions, lastSyncAt: new Date() },
      })
      synced++
    } catch {
      // Skip failed platforms silently
    }
  }

  revalidatePath("/social/analytics")
  revalidatePath("/social")
  return { synced }
}

export async function generateSocialCaption(context: {
  destinations?: string
  travelType?: string
  tone?: string
  platforms?: string[]
  additionalContext?: string
}): Promise<{ caption: string }> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const { getIntegrationConfig } = await import("@/lib/config")
  const config = await getIntegrationConfig()

  if (!config.anthropicApiKey) {
    throw new Error("Anthropic API key not configured. Add it in Settings → Integrations.")
  }

  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  const platformInfo =
    context.platforms && context.platforms.length > 0
      ? `Target platforms: ${context.platforms.join(", ")}. Respect their character limits and best practices.`
      : ""

  const prompt = [
    `You are a travel marketing expert. Write a compelling social media caption for a travel business.`,
    context.destinations ? `Destination(s): ${context.destinations}` : "",
    context.travelType ? `Travel type: ${context.travelType}` : "",
    context.tone ? `Tone: ${context.tone}` : "Tone: engaging and inspiring",
    platformInfo,
    context.additionalContext ? `Additional context: ${context.additionalContext}` : "",
    `Write only the caption text. Include relevant emojis. Include 3-5 relevant hashtags at the end.`,
  ]
    .filter(Boolean)
    .join("\n")

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  return { caption: text.trim() }
}
