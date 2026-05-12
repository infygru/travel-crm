import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const itineraries = await db.itinerary.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      contact: { select: { firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(itineraries)
}
