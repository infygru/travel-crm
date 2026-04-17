import { cookies } from "next/headers"
import { db } from "@/lib/db"
import jwt from "jsonwebtoken"

const PORTAL_SECRET = process.env.NEXTAUTH_SECRET!

export async function portalLogin(email: string, bookingRef: string) {
  // Find contact by email with a booking matching the ref
  const contact = await db.contact.findFirst({
    where: {
      email,
      bookings: { some: { bookingRef } },
    },
    include: { bookings: { where: { bookingRef } } },
  })
  if (!contact) return null

  const token = jwt.sign({ contactId: contact.id, email }, PORTAL_SECRET, { expiresIn: "7d" })
  return { token, contact }
}

export async function getPortalSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("portal_token")?.value
  if (!token) return null
  try {
    const payload = jwt.verify(token, PORTAL_SECRET) as { contactId: string; email: string }
    const contact = await db.contact.findUnique({
      where: { id: payload.contactId },
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
    })
    return contact
  } catch {
    return null
  }
}
