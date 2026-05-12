import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  parseOAuthState,
  exchangeFacebookCode,
  getLongLivedFacebookToken,
  getFacebookPages,
  getInstagramAccountInfo,
  exchangeTwitterCode,
  getTwitterUserInfo,
  exchangeLinkedInCode,
  getLinkedInUserInfo,
  exchangeTikTokCode,
  getTikTokUserInfo,
  exchangeYouTubeCode,
  getYouTubeChannelInfo,
} from "@/lib/social"

const REDIRECT_BASE = process.env.NEXTAUTH_URL || "http://localhost:3000"

const ALLOWED_PLATFORMS = new Set(["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube"])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  // Validate platform against known whitelist — prevents path traversal / injection
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.redirect(
      new URL("/social/accounts?error=invalid_platform", REDIRECT_BASE)
    )
  }

  const { searchParams } = request.nextUrl

  const code = searchParams.get("code")
  const stateRaw = searchParams.get("state") ?? ""
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/social/accounts?error=${encodeURIComponent(error)}`, REDIRECT_BASE)
    )
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      new URL("/social/accounts?error=missing_params", REDIRECT_BASE)
    )
  }

  const { userId, extra } = parseOAuthState(stateRaw)
  if (!userId) {
    return NextResponse.redirect(
      new URL("/social/accounts?error=invalid_state", REDIRECT_BASE)
    )
  }

  // Verify user exists to prevent state injection attacks
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) {
    return NextResponse.redirect(
      new URL("/social/accounts?error=invalid_state", REDIRECT_BASE)
    )
  }

  try {
    switch (platform) {
      case "facebook": {
        const tokens = await exchangeFacebookCode(code, "facebook")
        if (!tokens.access_token) throw new Error("No access token from Facebook")

        const longToken = await getLongLivedFacebookToken(tokens.access_token)
        const pages = await getFacebookPages(longToken)

        for (const page of pages) {
          if (!page.access_token) continue
          await db.socialAccount.upsert({
            where: { platform_accountId: { platform: "FACEBOOK", accountId: page.id } },
            create: {
              platform: "FACEBOOK",
              accountId: page.id,
              accountName: page.name,
              accountType: "page",
              avatarUrl: page.picture?.data?.url ?? null,
              accessToken: page.access_token,
              scopes: ["pages_manage_posts", "pages_read_engagement"],
              isActive: true,
              createdById: userId,
            },
            update: {
              accountName: page.name,
              avatarUrl: page.picture?.data?.url ?? null,
              accessToken: page.access_token,
              isActive: true,
            },
          })
        }
        break
      }

      case "instagram": {
        const tokens = await exchangeFacebookCode(code, "instagram")
        if (!tokens.access_token) throw new Error("No access token")

        const longToken = await getLongLivedFacebookToken(tokens.access_token)
        const pages = await getFacebookPages(longToken)

        for (const page of pages) {
          if (!page.instagram_business_account?.id) continue
          const igId = page.instagram_business_account.id
          const igInfo = await getInstagramAccountInfo(igId, page.access_token)

          await db.socialAccount.upsert({
            where: { platform_accountId: { platform: "INSTAGRAM", accountId: igId } },
            create: {
              platform: "INSTAGRAM",
              accountId: igId,
              accountName: igInfo.username || igInfo.name,
              accountType: "business",
              avatarUrl: igInfo.profile_picture_url ?? null,
              accessToken: page.access_token,
              scopes: ["instagram_content_publish", "instagram_basic"],
              isActive: true,
              metadata: { linkedFacebookPageId: page.id },
              createdById: userId,
            },
            update: {
              accountName: igInfo.username || igInfo.name,
              avatarUrl: igInfo.profile_picture_url ?? null,
              accessToken: page.access_token,
              isActive: true,
            },
          })
        }
        break
      }

      case "twitter": {
        if (!extra) throw new Error("Missing PKCE code verifier")
        const tokens = await exchangeTwitterCode(code, extra)
        if (!tokens.access_token) throw new Error("No access token from Twitter")

        const userInfo = await getTwitterUserInfo(tokens.access_token)
        if (!userInfo?.id) throw new Error("Could not fetch Twitter user info")

        const expiry = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null

        await db.socialAccount.upsert({
          where: { platform_accountId: { platform: "TWITTER", accountId: userInfo.id } },
          create: {
            platform: "TWITTER",
            accountId: userInfo.id,
            accountName: userInfo.name,
            accountType: "profile",
            avatarUrl: userInfo.profile_image_url ?? null,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            tokenExpiry: expiry,
            scopes: tokens.scope.split(" "),
            isActive: true,
            metadata: { username: userInfo.username },
            createdById: userId,
          },
          update: {
            accountName: userInfo.name,
            avatarUrl: userInfo.profile_image_url ?? null,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            tokenExpiry: expiry,
            isActive: true,
            metadata: { username: userInfo.username },
          },
        })
        break
      }

      case "linkedin": {
        const tokens = await exchangeLinkedInCode(code)
        if (!tokens.access_token) throw new Error("No access token from LinkedIn")

        const userInfo = await getLinkedInUserInfo(tokens.access_token)
        if (!userInfo?.sub) throw new Error("Could not fetch LinkedIn user info")

        const expiry = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null

        await db.socialAccount.upsert({
          where: { platform_accountId: { platform: "LINKEDIN", accountId: userInfo.sub } },
          create: {
            platform: "LINKEDIN",
            accountId: userInfo.sub,
            accountName: userInfo.name,
            accountType: "profile",
            avatarUrl: userInfo.picture ?? null,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            tokenExpiry: expiry,
            scopes: ["w_member_social"],
            isActive: true,
            createdById: userId,
          },
          update: {
            accountName: userInfo.name,
            avatarUrl: userInfo.picture ?? null,
            accessToken: tokens.access_token,
            tokenExpiry: expiry,
            isActive: true,
          },
        })
        break
      }

      case "tiktok": {
        const tokenData = await exchangeTikTokCode(code)
        if (!tokenData.access_token) throw new Error("No access token from TikTok")

        const userInfo = await getTikTokUserInfo(tokenData.access_token)
        const accountId = userInfo.open_id || tokenData.open_id

        const expiry = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null

        await db.socialAccount.upsert({
          where: { platform_accountId: { platform: "TIKTOK", accountId } },
          create: {
            platform: "TIKTOK",
            accountId,
            accountName: userInfo.display_name || accountId,
            accountType: "creator",
            avatarUrl: userInfo.avatar_url ?? null,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token ?? null,
            tokenExpiry: expiry,
            scopes: ["video.publish", "video.upload"],
            isActive: true,
            createdById: userId,
          },
          update: {
            accountName: userInfo.display_name || accountId,
            avatarUrl: userInfo.avatar_url ?? null,
            accessToken: tokenData.access_token,
            tokenExpiry: expiry,
            isActive: true,
          },
        })
        break
      }

      case "youtube": {
        const tokens = await exchangeYouTubeCode(code)
        if (!tokens.access_token) throw new Error("No access token from YouTube")

        const channelInfo = await getYouTubeChannelInfo(tokens.access_token)
        if (!channelInfo?.id) throw new Error("No YouTube channel found")

        const expiry = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null

        await db.socialAccount.upsert({
          where: { platform_accountId: { platform: "YOUTUBE", accountId: channelInfo.id } },
          create: {
            platform: "YOUTUBE",
            accountId: channelInfo.id,
            accountName: channelInfo.title,
            accountType: "channel",
            avatarUrl: channelInfo.thumbnailUrl ?? null,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            tokenExpiry: expiry,
            scopes: ["youtube.upload"],
            isActive: true,
            createdById: userId,
          },
          update: {
            accountName: channelInfo.title,
            avatarUrl: channelInfo.thumbnailUrl ?? null,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            tokenExpiry: expiry,
            isActive: true,
          },
        })
        break
      }

      default:
        throw new Error(`Unknown platform: ${platform}`)
    }

    return NextResponse.redirect(
      new URL(`/social/accounts?connected=${platform}`, REDIRECT_BASE)
    )
  } catch (err) {
    console.error(`[social/callback/${platform}] error:`, err)
    const msg = err instanceof Error ? err.message : "Connection failed"
    return NextResponse.redirect(
      new URL(`/social/accounts?error=${encodeURIComponent(msg)}`, REDIRECT_BASE)
    )
  }
}
