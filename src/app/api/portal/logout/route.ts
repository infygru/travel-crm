import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set("portal_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })
  return response
}

export async function GET() {
  const response = NextResponse.redirect(new URL("/portal/login", process.env.NEXTAUTH_URL || "http://localhost:3000"))
  response.cookies.set("portal_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })
  return response
}
