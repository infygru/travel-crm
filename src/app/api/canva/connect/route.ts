import { NextResponse } from "next/server"
import { getCanvaAuthUrl, generateCodeVerifier, generateCodeChallenge } from "@/lib/canva"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const nonce = crypto.randomUUID()

  // Use :: as separator — safe because base64url, UUIDs, and cUIDs never contain ::
  // Format: nonce::codeVerifier::userId
  const state = `${nonce}::${codeVerifier}::${session.user.id}`
  const url = await getCanvaAuthUrl(state, codeChallenge)

  return NextResponse.redirect(url)
}
