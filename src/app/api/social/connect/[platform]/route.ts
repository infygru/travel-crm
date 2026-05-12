import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  buildOAuthState,
  getFacebookOAuthUrl,
  getTwitterOAuthUrl,
  getLinkedInOAuthUrl,
  getTikTokOAuthUrl,
  getYouTubeOAuthUrl,
  generateCodeVerifier,
  generateCodeChallenge,
} from "@/lib/social"

const BASE = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { platform } = await params
  const userId = session.user.id

  try {
    switch (platform) {
      case "facebook": {
        const state = buildOAuthState("facebook", userId)
        return NextResponse.redirect(await getFacebookOAuthUrl(state, false))
      }
      case "instagram": {
        const state = buildOAuthState("instagram", userId)
        return NextResponse.redirect(await getFacebookOAuthUrl(state, true))
      }
      case "twitter": {
        const verifier = generateCodeVerifier()
        const challenge = await generateCodeChallenge(verifier)
        const state = buildOAuthState("twitter", userId, verifier)
        return NextResponse.redirect(await getTwitterOAuthUrl(state, challenge))
      }
      case "linkedin": {
        const state = buildOAuthState("linkedin", userId)
        return NextResponse.redirect(await getLinkedInOAuthUrl(state))
      }
      case "tiktok": {
        const state = buildOAuthState("tiktok", userId)
        return NextResponse.redirect(await getTikTokOAuthUrl(state))
      }
      case "youtube": {
        const state = buildOAuthState("youtube", userId)
        return NextResponse.redirect(await getYouTubeOAuthUrl(state))
      }
      default:
        return NextResponse.json({ error: "Unknown platform" }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Configuration error"
    return NextResponse.redirect(new URL(`/social/accounts?error=${encodeURIComponent(msg)}`, BASE))
  }
}
