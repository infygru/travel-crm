// ─────────────────────────────────────────────
// SOCIAL MEDIA LIBRARY
// OAuth + Publishing for all 6 platforms
// ─────────────────────────────────────────────

import type { SocialAccount, SocialMediaType } from "@prisma/client"
import { getIntegrationConfig } from "@/lib/config"
export { PLATFORM_CONFIGS } from "@/lib/social-constants"

// BASE_URL resolved at call time via getIntegrationConfig()
function baseUrl(appUrl: string) { return appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000" }

// ─── STATE HELPERS ────────────────────────────

export function buildOAuthState(platform: string, userId: string, extra?: string): string {
  const nonce = Math.random().toString(36).substring(2, 12)
  return extra
    ? `${platform}::${userId}::${nonce}::${extra}`
    : `${platform}::${userId}::${nonce}`
}

export function parseOAuthState(state: string): {
  platform: string
  userId: string
  nonce: string
  extra?: string
} {
  const parts = state.split("::")
  return {
    platform: parts[0],
    userId: parts[1],
    nonce: parts[2],
    extra: parts.length > 3 ? parts.slice(3).join("::") : undefined,
  }
}

// ─── FACEBOOK / INSTAGRAM OAuth ───────────────

export async function getFacebookOAuthUrl(state: string, forInstagram = false): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.facebookAppId) throw new Error("Facebook App ID not configured. Go to Settings → Integrations.")
  const scope = forInstagram
    ? "pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management"
    : "pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,business_management"
  const params = new URLSearchParams({
    client_id: cfg.facebookAppId,
    redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/${forInstagram ? "instagram" : "facebook"}`,
    state,
    scope,
    response_type: "code",
  })
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`
}

export async function exchangeFacebookCode(
  code: string,
  platform: "facebook" | "instagram"
): Promise<{ access_token: string; token_type: string; expires_in?: number }> {
  const cfg = await getIntegrationConfig()
  if (!cfg.facebookAppId || !cfg.facebookAppSecret) throw new Error("Facebook credentials not configured.")
  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: cfg.facebookAppId,
        client_secret: cfg.facebookAppSecret,
        redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/${platform}`,
        code,
      })
  )
  return res.json()
}

export async function getLongLivedFacebookToken(shortToken: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.facebookAppId || !cfg.facebookAppSecret) throw new Error("Facebook credentials not configured.")
  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: cfg.facebookAppId,
        client_secret: cfg.facebookAppSecret,
        fb_exchange_token: shortToken,
      })
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.access_token
}

export async function getFacebookPages(userToken: string): Promise<
  Array<{
    id: string
    name: string
    access_token: string
    picture?: { data: { url: string } }
    instagram_business_account?: { id: string }
  }>
> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,picture,instagram_business_account&access_token=${userToken}`
  )
  const data = await res.json()
  return data.data || []
}

export async function getInstagramAccountInfo(
  igUserId: string,
  pageToken: string
): Promise<{ id: string; name: string; username: string; profile_picture_url?: string }> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igUserId}?fields=id,name,username,profile_picture_url&access_token=${pageToken}`
  )
  return res.json()
}

// ─── TWITTER OAuth 2.0 (PKCE) ─────────────────

export function generateCodeVerifier(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  let v = ""
  for (let i = 0; i < 128; i++) v += chars.charAt(Math.floor(Math.random() * chars.length))
  return v
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export async function getTwitterOAuthUrl(state: string, codeChallenge: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.twitterClientId) throw new Error("Twitter Client ID not configured. Go to Settings → Integrations.")
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.twitterClientId,
    redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/twitter`,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })
  return `https://twitter.com/i/oauth2/authorize?${params}`
}

export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number; scope: string }> {
  const cfg = await getIntegrationConfig()
  if (!cfg.twitterClientId || !cfg.twitterClientSecret) throw new Error("Twitter credentials not configured.")
  const credentials = Buffer.from(`${cfg.twitterClientId}:${cfg.twitterClientSecret}`).toString("base64")
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/twitter`,
      code_verifier: codeVerifier,
    }),
  })
  return res.json()
}

export async function getTwitterUserInfo(
  accessToken: string
): Promise<{ id: string; name: string; username: string; profile_image_url?: string }> {
  const res = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return data.data
}

// ─── LINKEDIN OAuth ───────────────────────────

export async function getLinkedInOAuthUrl(state: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.linkedinClientId) throw new Error("LinkedIn Client ID not configured. Go to Settings → Integrations.")
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.linkedinClientId,
    redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/linkedin`,
    scope: "openid profile w_member_social",
    state,
  })
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`
}

export async function exchangeLinkedInCode(
  code: string
): Promise<{ access_token: string; expires_in?: number; refresh_token?: string }> {
  const cfg = await getIntegrationConfig()
  if (!cfg.linkedinClientId || !cfg.linkedinClientSecret) throw new Error("LinkedIn credentials not configured.")
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: cfg.linkedinClientId,
      client_secret: cfg.linkedinClientSecret,
      redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/linkedin`,
    }),
  })
  return res.json()
}

export async function getLinkedInUserInfo(
  accessToken: string
): Promise<{ sub: string; name: string; picture?: string }> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

// ─── TIKTOK OAuth ─────────────────────────────

export async function getTikTokOAuthUrl(state: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.tiktokClientKey) throw new Error("TikTok Client Key not configured. Go to Settings → Integrations.")
  const params = new URLSearchParams({
    client_key: cfg.tiktokClientKey,
    scope: "user.info.basic,video.publish,video.upload",
    response_type: "code",
    redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/tiktok`,
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`
}

export async function exchangeTikTokCode(
  code: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number; open_id: string }> {
  const cfg = await getIntegrationConfig()
  if (!cfg.tiktokClientKey || !cfg.tiktokClientSecret) throw new Error("TikTok credentials not configured.")
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: cfg.tiktokClientKey,
      client_secret: cfg.tiktokClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/tiktok`,
    }),
  })
  const data = await res.json()
  return data.data || data
}

export async function getTikTokUserInfo(
  accessToken: string
): Promise<{ open_id: string; display_name: string; avatar_url?: string }> {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  return data.data?.user || {}
}

// ─── YOUTUBE OAuth ────────────────────────────

export async function getYouTubeOAuthUrl(state: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.youtubeClientId) throw new Error("YouTube Client ID not configured. Go to Settings → Integrations.")
  const params = new URLSearchParams({
    client_id: cfg.youtubeClientId,
    redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/youtube`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
    access_type: "offline",
    state,
    prompt: "consent",
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeYouTubeCode(
  code: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const cfg = await getIntegrationConfig()
  if (!cfg.youtubeClientId || !cfg.youtubeClientSecret) throw new Error("YouTube credentials not configured.")
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.youtubeClientId,
      client_secret: cfg.youtubeClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${baseUrl(cfg.appUrl)}/api/social/callback/youtube`,
    }),
  })
  return res.json()
}

export async function getYouTubeChannelInfo(
  accessToken: string
): Promise<{ id: string; title: string; thumbnailUrl?: string }> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  const channel = data.items?.[0]
  if (!channel) throw new Error("No YouTube channel found")
  return {
    id: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url,
  }
}

// ─── TOKEN REFRESH ────────────────────────────

/**
 * Refreshes an expired access token for platforms that support it.
 * Returns the new access token (and updates the DB record).
 */
export async function refreshAccessToken(account: SocialAccount): Promise<string> {
  if (!account.refreshToken) {
    throw new Error(`${account.platform} token expired and no refresh token is stored. Please reconnect.`)
  }

  const cfg = await getIntegrationConfig()

  if (account.platform === "TWITTER") {
    if (!cfg.twitterClientId || !cfg.twitterClientSecret) throw new Error("Twitter credentials not configured.")
    const credentials = Buffer.from(`${cfg.twitterClientId}:${cfg.twitterClientSecret}`).toString("base64")
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: account.refreshToken }),
    })
    const data = await res.json()
    if (!data.access_token) throw new Error("Twitter token refresh failed")
    const { db } = await import("@/lib/db")
    await db.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? account.refreshToken,
        tokenExpiry: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      },
    })
    return data.access_token
  }

  if (account.platform === "YOUTUBE") {
    if (!cfg.youtubeClientId || !cfg.youtubeClientSecret) throw new Error("YouTube credentials not configured.")
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.youtubeClientId,
        client_secret: cfg.youtubeClientSecret,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      }),
    })
    const data = await res.json()
    if (!data.access_token) throw new Error("YouTube token refresh failed")
    const { db } = await import("@/lib/db")
    await db.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        tokenExpiry: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      },
    })
    return data.access_token
  }

  if (account.platform === "LINKEDIN") {
    if (!cfg.linkedinClientId || !cfg.linkedinClientSecret) throw new Error("LinkedIn credentials not configured.")
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: account.refreshToken,
        client_id: cfg.linkedinClientId,
        client_secret: cfg.linkedinClientSecret,
      }),
    })
    const data = await res.json()
    if (!data.access_token) throw new Error("LinkedIn token refresh failed")
    const { db } = await import("@/lib/db")
    await db.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? account.refreshToken,
        tokenExpiry: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      },
    })
    return data.access_token
  }

  if (account.platform === "TIKTOK") {
    if (!cfg.tiktokClientKey || !cfg.tiktokClientSecret) throw new Error("TikTok credentials not configured.")
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: cfg.tiktokClientKey,
        client_secret: cfg.tiktokClientSecret,
        grant_type: "refresh_token",
        refresh_token: account.refreshToken,
      }),
    })
    const data = await res.json()
    const payload = data.data || data
    if (!payload.access_token) throw new Error("TikTok token refresh failed")
    const { db } = await import("@/lib/db")
    await db.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? account.refreshToken,
        tokenExpiry: payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000) : null,
      },
    })
    return payload.access_token
  }

  // Facebook page tokens are long-lived (60d). When expired, user must reconnect.
  throw new Error(`${account.platform} token expired. Please reconnect the account.`)
}

/**
 * Returns a valid access token, refreshing if needed.
 */
export async function getValidToken(account: SocialAccount): Promise<string> {
  // If no expiry stored or not expired, use current token
  if (!account.tokenExpiry || account.tokenExpiry > new Date(Date.now() + 60_000)) {
    return account.accessToken
  }
  // Token is expired (or will expire in <1 minute) — refresh it
  return refreshAccessToken(account)
}

// ─── PUBLISHERS ───────────────────────────────

type PostPayload = {
  caption: string
  mediaUrls: string[]
  mediaType: SocialMediaType
  firstComment?: string | null
  tags?: string[]
}

export async function publishToFacebook(
  account: SocialAccount,
  post: PostPayload
): Promise<{ id: string; url: string }> {
  const pageId = account.accountId
  const token = await getValidToken(account)

  // Multi-photo carousel: post each image as attached photo (unpublished), then publish feed post
  if (post.mediaType === "CAROUSEL" && post.mediaUrls.length > 1) {
    const photoIds = await Promise.all(
      post.mediaUrls.slice(0, 10).map(async (url) => {
        const r = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, published: false, access_token: token }),
        })
        const d = await r.json()
        if (d.error) throw new Error(d.error.message)
        return { media_fbid: d.id }
      })
    )
    const feedRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: post.caption,
        attached_media: photoIds,
        access_token: token,
      }),
    })
    const feedData = await feedRes.json()
    if (feedData.error) throw new Error(feedData.error.message)
    return { id: feedData.id, url: `https://www.facebook.com/${pageId}/posts/${feedData.id}` }
  }

  if (
    post.mediaUrls.length > 0 &&
    (post.mediaType === "IMAGE" || post.mediaType === "CAROUSEL")
  ) {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: post.mediaUrls[0],
        caption: post.caption,
        access_token: token,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    const postId = data.post_id || data.id
    return { id: postId, url: `https://www.facebook.com/${pageId}/posts/${postId}` }
  }

  if (
    post.mediaUrls.length > 0 &&
    (post.mediaType === "VIDEO" || post.mediaType === "REEL" || post.mediaType === "STORY")
  ) {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_url: post.mediaUrls[0],
        description: post.caption,
        access_token: token,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return { id: data.id, url: `https://www.facebook.com/${pageId}/videos/${data.id}` }
  }

  // Text post
  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: post.caption, access_token: token }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { id: data.id, url: `https://www.facebook.com/${pageId}/posts/${data.id}` }
}

export async function publishToInstagram(
  account: SocialAccount,
  post: PostPayload
): Promise<{ id: string; url: string }> {
  const igUserId = account.accountId
  const token = await getValidToken(account)

  const containerParams: Record<string, string> = {
    caption: post.caption.substring(0, 2200),
    access_token: token,
  }

  let isVideo = false

  if (
    post.mediaType === "REEL" ||
    (post.mediaType === "VIDEO" && post.mediaUrls.length > 0)
  ) {
    isVideo = true
    containerParams.media_type = "REELS"
    containerParams.video_url = post.mediaUrls[0]
    containerParams.share_to_feed = "true"
  } else if (post.mediaType === "CAROUSEL" && post.mediaUrls.length > 1) {
    const childIds = await Promise.all(
      post.mediaUrls.slice(0, 10).map(async (url) => {
        const childRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: url, is_carousel_item: "true", access_token: token }),
        })
        const child = await childRes.json()
        if (child.error) throw new Error(`Instagram carousel child failed: ${child.error.message}`)
        return child.id as string
      })
    )
    containerParams.media_type = "CAROUSEL"
    containerParams.children = childIds.join(",")
  } else if (post.mediaUrls.length > 0) {
    containerParams.image_url = post.mediaUrls[0]
  } else {
    throw new Error("Instagram requires at least one image or video")
  }

  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerParams),
  })
  const container = await containerRes.json()
  if (container.error) throw new Error(container.error.message)

  // For videos/reels: Instagram processes async. We store the container ID and publish
  // immediately — Instagram will transition the status in the background.
  // We no longer block with a polling loop (avoids serverless timeout).
  // If status is still PROCESSING, we attempt to publish anyway; Instagram handles it.
  if (isVideo) {
    // Brief wait to let Instagram start processing before we publish
    await new Promise((r) => setTimeout(r, 3000))
    const statusRes = await fetch(
      `https://graph.facebook.com/v21.0/${container.id}?fields=status_code&access_token=${token}`
    )
    const status = await statusRes.json()
    if (status.status_code === "ERROR") {
      throw new Error("Instagram media processing failed. Check the video format and URL.")
    }
    // If FINISHED, great. If IN_PROGRESS, proceed — publish call will queue and complete shortly.
  }

  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  })
  const published = await publishRes.json()
  if (published.error) throw new Error(published.error.message)

  if (post.firstComment && published.id) {
    await fetch(`https://graph.facebook.com/v21.0/${published.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: post.firstComment, access_token: token }),
    }).catch(() => {})
  }

  return { id: published.id, url: `https://www.instagram.com/p/${published.id}/` }
}

export async function publishToTwitter(
  account: SocialAccount,
  post: PostPayload
): Promise<{ id: string; url: string }> {
  const token = await getValidToken(account)
  let text = post.caption
  if (text.length > 280) text = text.substring(0, 277) + "..."

  const body: Record<string, unknown> = { text }

  if (post.mediaUrls.length > 0 && post.mediaType !== "TEXT") {
    // Twitter v2 API accepts OAuth 2.0 user context tokens for the v2 tweets endpoint.
    // The v1.1 media/upload endpoint ALSO accepts OAuth 2.0 user tokens (not app-only Bearer).
    // The user token obtained via PKCE flow is a user context token, which is correct.
    const mediaIds = await uploadTwitterMedia(token, post.mediaUrls.slice(0, 4))
    if (mediaIds.length > 0) {
      body.media = { media_ids: mediaIds }
    }
  }

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message || data.title || "Tweet failed")
  }
  if (!data.data?.id) {
    throw new Error(data.detail || data.title || "Tweet failed — check your Twitter app permissions (needs Read+Write)")
  }

  const meta = account.metadata as Record<string, string> | null
  const username = meta?.username || "user"
  return { id: data.data.id, url: `https://twitter.com/${username}/status/${data.data.id}` }
}

async function uploadTwitterMedia(token: string, urls: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const url of urls) {
    try {
      const imageRes = await fetch(url)
      if (!imageRes.ok) continue
      const buffer = await imageRes.arrayBuffer()
      const contentType = imageRes.headers.get("content-type") || "image/jpeg"
      const form = new FormData()
      form.append("media", new Blob([buffer], { type: contentType }))
      // v1.1 media upload with OAuth 2.0 user token (NOT app-only Bearer)
      const uploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!uploadRes.ok) continue
      const uploadData = await uploadRes.json()
      if (uploadData.media_id_string) ids.push(uploadData.media_id_string)
    } catch {
      // Skip failed media — post will still publish as text-only
    }
  }
  return ids
}

export async function publishToLinkedIn(
  account: SocialAccount,
  post: PostPayload
): Promise<{ id: string; url: string }> {
  const token = await getValidToken(account)
  const personUrn = `urn:li:person:${account.accountId}`

  const body: Record<string, unknown> = {
    author: personUrn,
    commentary: post.caption.substring(0, 3000),
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  }

  if (post.mediaUrls.length > 0 && post.mediaType === "IMAGE") {
    try {
      const imageUrn = await uploadLinkedInImage(token, personUrn, post.mediaUrls[0])
      if (imageUrn) {
        body.content = { media: { title: "Shared via Travel CRM", id: imageUrn } }
      }
    } catch {
      // Fall back to text-only
    }
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202411",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message || `LinkedIn error ${res.status}`)
  }

  const postId =
    res.headers.get("x-linkedin-id") ||
    res.headers.get("x-restli-id") ||
    `linkedin-${Date.now()}`
  return { id: postId, url: `https://www.linkedin.com/feed/update/${postId}/` }
}

async function uploadLinkedInImage(
  token: string,
  authorUrn: string,
  imageUrl: string
): Promise<string | null> {
  const registerRes = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202411",
      },
      body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
    }
  )
  const registerData = await registerRes.json()
  const uploadUrl = registerData.value?.uploadUrl
  const imageUrn = registerData.value?.image
  if (!uploadUrl || !imageUrn) return null

  const imageRes = await fetch(imageUrl)
  if (!imageRes.ok) return null
  const buffer = await imageRes.arrayBuffer()

  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: buffer,
  })

  return imageUrn
}

export async function publishToTikTok(
  account: SocialAccount,
  post: PostPayload
): Promise<{ id: string; url: string }> {
  const token = await getValidToken(account)
  if (post.mediaUrls.length === 0) throw new Error("TikTok requires a video URL")

  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: post.caption.substring(0, 2200),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: post.mediaUrls[0],
      },
    }),
  })

  const data = await res.json()
  if (data.error?.code && data.error.code !== "ok") {
    throw new Error(data.error.message || "TikTok publish failed")
  }

  const publishId = data.data?.publish_id || "pending"
  return { id: publishId, url: `https://www.tiktok.com/@${account.accountName}` }
}

export async function publishToYouTube(
  account: SocialAccount,
  post: PostPayload
): Promise<{ id: string; url: string }> {
  const token = await getValidToken(account)
  if (post.mediaUrls.length === 0) throw new Error("YouTube requires a video URL")

  const isShort = post.mediaType === "REEL"
  const videoUrl = post.mediaUrls[0]

  // HEAD the video to get content length and type without downloading it
  const headRes = await fetch(videoUrl, { method: "HEAD" }).catch(() => null)
  const contentType = headRes?.headers.get("content-type") || "video/mp4"
  const contentLength = headRes?.headers.get("content-length") || undefined

  // Step 1: Initiate resumable upload session
  const initHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Upload-Content-Type": contentType,
  }
  if (contentLength) initHeaders["X-Upload-Content-Length"] = contentLength

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: initHeaders,
      body: JSON.stringify({
        snippet: {
          title: post.caption.substring(0, 100),
          description: post.caption,
          tags: post.tags ?? [],
          categoryId: "22",
        },
        status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
      }),
    }
  )

  const uploadUrl = initRes.headers.get("location")
  if (!uploadUrl) throw new Error("Failed to get YouTube upload URL. Check your OAuth scopes.")

  // Step 2: Stream the video directly to YouTube without loading into memory
  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) throw new Error("Failed to fetch video from the provided URL")

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    },
    // Stream the response body directly — avoids loading the full video into memory
    body: videoRes.body,
    // @ts-ignore — Node.js fetch supports duplex streaming
    duplex: "half",
  })

  const uploadData = await uploadRes.json()
  if (!uploadData.id) throw new Error(uploadData.error?.message || "YouTube upload failed")

  const url = isShort
    ? `https://www.youtube.com/shorts/${uploadData.id}`
    : `https://www.youtube.com/watch?v=${uploadData.id}`

  return { id: uploadData.id, url }
}

// ─── MAIN DISPATCHER ──────────────────────────

export async function publishPostToPlatform(
  account: SocialAccount,
  post: PostPayload
): Promise<{ id: string; url: string }> {
  switch (account.platform) {
    case "FACEBOOK":
      return publishToFacebook(account, post)
    case "INSTAGRAM":
      return publishToInstagram(account, post)
    case "TWITTER":
      return publishToTwitter(account, post)
    case "LINKEDIN":
      return publishToLinkedIn(account, post)
    case "TIKTOK":
      return publishToTikTok(account, post)
    case "YOUTUBE":
      return publishToYouTube(account, post)
    default:
      throw new Error(`Unsupported platform: ${account.platform}`)
  }
}
