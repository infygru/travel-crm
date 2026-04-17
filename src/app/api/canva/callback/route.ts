import { NextRequest, NextResponse } from "next/server"
import { exchangeCanvaCode } from "@/lib/canva"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 })
  const tokens = await exchangeCanvaCode(code)
  // In production store token in DB per user. For now redirect with token in session.
  const response = NextResponse.redirect(new URL("/posters?connected=true", request.url))
  response.cookies.set("canva_token", tokens.access_token, { httpOnly: true, maxAge: 3600 })
  return response
}
