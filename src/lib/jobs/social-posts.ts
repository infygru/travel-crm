import { db } from "@/lib/db"
import { publishPostToPlatform } from "@/lib/social"
import type { SocialPostStatus } from "@prisma/client"

export async function processScheduledSocialPosts(): Promise<{
  processed: number
  errors: number
  details: string[]
}> {
  const now = new Date()
  const details: string[] = []

  const duePosts = await db.socialPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    include: { targets: { include: { account: true } } },
  })

  let processed = 0
  let errors = 0

  for (const post of duePosts) {
    try {
      await db.socialPost.update({ where: { id: post.id }, data: { status: "PUBLISHING" } })

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
            await db.socialPostTarget.update({
              where: { id: target.id },
              data: {
                status: "FAILED",
                errorMessage: err instanceof Error ? err.message : "Unknown error",
              },
            })
          }
        })
      )

      const updatedTargets = await db.socialPostTarget.findMany({
        where: { postId: post.id },
      })
      const allPublished = updatedTargets.every((t) => t.status === "PUBLISHED")
      const anyPublished = updatedTargets.some((t) => t.status === "PUBLISHED")
      const finalStatus: SocialPostStatus = allPublished
        ? "PUBLISHED"
        : anyPublished
          ? "PARTIALLY_PUBLISHED"
          : "FAILED"

      await db.socialPost.update({
        where: { id: post.id },
        data: { status: finalStatus, publishedAt: anyPublished ? new Date() : null },
      })

      details.push(`Published post ${post.id} → ${finalStatus}`)
      processed++
    } catch (err) {
      errors++
      details.push(`Failed post ${post.id}: ${err instanceof Error ? err.message : "Unknown"}`)
      await db.socialPost.update({
        where: { id: post.id },
        data: { status: "FAILED" },
      }).catch(() => {})
    }
  }

  return { processed, errors, details }
}
