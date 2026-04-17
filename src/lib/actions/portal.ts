"use server"
import { getPortalSession } from "@/lib/portal-auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export async function getPortalDashboardData() {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")

  const [bookings, itineraries, tickets] = await Promise.all([
    db.booking.findMany({
      where: { contactId: contact.id },
      include: { package: true, agent: true },
      orderBy: { startDate: "asc" },
    }),
    db.itinerary.findMany({
      where: { contactId: contact.id, status: { in: ["SHARED", "APPROVED"] } },
      include: { days: { include: { items: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.supportTicket.findMany({
      where: { contactId: contact.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  return { contact, bookings, itineraries, tickets }
}

export async function getPortalBooking(bookingId: string) {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")
  return db.booking.findFirst({
    where: { id: bookingId, contactId: contact.id },
    include: { package: true, passengers: true, payments: true, documents: true },
  })
}

export async function getPortalBookings() {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")
  return db.booking.findMany({
    where: { contactId: contact.id },
    include: { package: true, agent: true },
    orderBy: { startDate: "asc" },
  })
}

export async function getPortalItineraries() {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")
  return db.itinerary.findMany({
    where: { contactId: contact.id, status: { in: ["SHARED", "APPROVED"] } },
    include: { days: { include: { items: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPortalTickets() {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")
  return db.supportTicket.findMany({
    where: { contactId: contact.id },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPortalTicket(ticketId: string) {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")
  return db.supportTicket.findFirst({
    where: { id: ticketId, contactId: contact.id },
    include: {
      replies: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, image: true } } },
      },
    },
  })
}

export async function createPortalTicket(data: {
  subject: string
  description: string
  category: string
  bookingId?: string
}) {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")

  const count = await db.supportTicket.count()
  const ticketNumber = `TKT-${String(count + 1).padStart(5, "0")}`

  return db.supportTicket.create({
    data: {
      ticketNumber,
      subject: data.subject,
      description: data.description,
      category: data.category as "BOOKING_ISSUE" | "REFUND_REQUEST" | "COMPLAINT" | "GENERAL_INQUIRY" | "DOCUMENT_REQUEST" | "OTHER",
      priority: "MEDIUM",
      status: "OPEN",
      channel: "WEB_FORM",
      contactId: contact.id,
      bookingId: data.bookingId || undefined,
    },
  })
}

export async function createPortalTicketReply(ticketId: string, body: string) {
  const contact = await getPortalSession()
  if (!contact) redirect("/portal/login")

  // Verify ticket belongs to this contact
  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, contactId: contact.id },
  })
  if (!ticket) throw new Error("Ticket not found")

  return db.ticketReply.create({
    data: {
      ticketId,
      body,
      isInternal: false,
      fromEmail: contact.email ?? undefined,
    },
  })
}
