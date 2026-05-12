import { NextRequest, NextResponse } from "next/server"
import { exchangeCanvaCode } from "@/lib/canva"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.redirect(new URL("/posters?error=missing_code", request.url))

  // state format: nonce::codeVerifier::userId
  // Using :: separator — safe because base64url and cUIDs never contain ::
  const state = request.nextUrl.searchParams.get("state") ?? ""
  const parts = state.split("::")

  if (parts.length !== 3) {
    return NextResponse.redirect(new URL("/posters?error=invalid_state", request.url))
  }

  const [, codeVerifier, userId] = parts

  if (!codeVerifier || !userId) {
    return NextResponse.redirect(new URL("/posters?error=invalid_state", request.url))
  }

  // Verify the user exists to prevent state injection
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) {
    return NextResponse.redirect(new URL("/posters?error=invalid_user", request.url))
  }

  try {
    const tokens = await exchangeCanvaCode(code, codeVerifier)
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/posters?error=token_exchange_failed", request.url))
    }

    await db.user.update({
      where: { id: userId },
      data: { canvaToken: tokens.access_token },
    })

    return NextResponse.redirect(new URL("/posters?connected=true", request.url))
  } catch (err) {
    console.error("[canva/callback] error:", err)
    return NextResponse.redirect(new URL("/posters?error=callback_failed", request.url))
  }
}
