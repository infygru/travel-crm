import { NextResponse } from "next/server"
import { getCanvaAuthUrl } from "@/lib/canva"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const state = Math.random().toString(36).substring(7)
  const url = await getCanvaAuthUrl(state)
  return NextResponse.redirect(url)
}
