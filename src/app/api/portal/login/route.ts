import { NextRequest, NextResponse } from "next/server"
import { portalLogin } from "@/lib/portal-auth"

export async function POST(request: NextRequest) {
  const { email, bookingRef } = await request.json()
  const result = await portalLogin(email, bookingRef)
  if (!result) {
    return NextResponse.json({ error: "Invalid email or booking reference" }, { status: 401 })
  }
  const response = NextResponse.json({ success: true })
  response.cookies.set("portal_token", result.token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return response
}
