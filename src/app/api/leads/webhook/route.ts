import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LeadSource } from "@prisma/client";

// Webhook endpoint for lead ingestion from external sources
// Accepts: Google Ads, Facebook Lead Ads, Zapier, Make.com, custom forms
//
// Usage: POST /api/leads/webhook?source=GOOGLE_ADS&apiKey=YOUR_KEY
// The apiKey MUST match the WEBHOOK_SECRET environment variable.

const VALID_SOURCES = new Set<string>(Object.values(LeadSource))

function sanitizeString(val: unknown, maxLen = 500): string | undefined {
  if (val === undefined || val === null || val === "") return undefined
  const s = String(val).trim()
  if (!s) return undefined
  // Strip HTML tags to prevent stored XSS
  return s.replace(/<[^>]*>/g, "").substring(0, maxLen)
}

function normalize(body: Record<string, unknown>) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = body[k]
      if (v !== undefined && v !== null && v !== "") return sanitizeString(v)
    }
    return undefined
  }

  let firstName = get("firstName", "first_name", "fname")
  let lastName = get("lastName", "last_name", "lname")

  if (!firstName) {
    const fullName = get("full_name", "name", "contact_name")
    if (fullName) {
      const parts = fullName.trim().split(/\s+/)
      firstName = parts[0]
      lastName = parts.slice(1).join(" ") || undefined
    }
  }

  // Facebook Lead Ads sends field_data array
  if (!firstName && Array.isArray(body.field_data)) {
    const fieldData = body.field_data as Array<{ name: string; values: string[] }>
    const byName = Object.fromEntries(
      fieldData.map((f) => [f.name.toLowerCase(), sanitizeString(f.values?.[0])])
    )
    firstName = byName["first_name"] ?? byName["full_name"]?.split(" ")[0]
    lastName = (byName["last_name"] ?? byName["full_name"]?.split(" ").slice(1).join(" ")) || undefined
    if (!firstName && byName["full_name"]) firstName = byName["full_name"]
  }

  const email = get("email", "email_address")
  const phone = get("phone", "phone_number", "mobile", "contact_phone")
  const message = sanitizeString(
    get("message", "notes", "description", "inquiry", "questions", "comment"),
    2000
  )
  const destination = get("destination", "travel_destination", "interest", "package")
  const budget = get("budget", "travel_budget", "max_budget")
  const travelDate = get("travel_date", "departure_date", "date", "travel_month")

  // Basic email format check
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { firstName: firstName ?? "Unknown", lastName: lastName ?? "", email: undefined, phone, notes: undefined }
  }

  const extraNotes = [
    destination ? `Destination: ${destination}` : null,
    budget ? `Budget: ${budget}` : null,
    travelDate ? `Travel Date: ${travelDate}` : null,
    message ? `Message: ${message}` : null,
  ].filter(Boolean).join("\n")

  return {
    firstName: firstName ?? "Unknown",
    lastName: lastName ?? "",
    email,
    phone,
    notes: extraNotes || undefined,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const source = searchParams.get("source") ?? "WEBSITE"
    const apiKey = searchParams.get("apiKey")
    const ownerId = searchParams.get("ownerId") ?? undefined

    // API key is always required
    const secret = process.env.WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Webhook not configured on server" }, { status: 503 })
    }
    if (apiKey !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate source against known enum values
    const validSource: LeadSource = VALID_SOURCES.has(source)
      ? (source as LeadSource)
      : LeadSource.OTHER

    const body = await req.json().catch(() => ({})) as Record<string, unknown>

    // Facebook sends a verification challenge on setup
    if (body["hub.mode"] === "subscribe") {
      return new NextResponse(String(body["hub.challenge"]), { status: 200 })
    }

    // Facebook wraps leads in entry > changes > value > leads[]
    let leads: Record<string, unknown>[] = [body]
    if (Array.isArray(body.entry)) {
      leads = []
      for (const entry of body.entry as Array<{ changes?: Array<{ value?: { leads?: unknown[] } }> }>) {
        for (const change of entry.changes ?? []) {
          if (Array.isArray(change.value?.leads)) {
            leads.push(...(change.value.leads as Record<string, unknown>[]))
          }
        }
      }
      if (leads.length === 0) leads = [body]
    }

    // Limit batch size to prevent abuse
    if (leads.length > 100) {
      return NextResponse.json({ error: "Batch too large (max 100 leads per request)" }, { status: 400 })
    }

    const created: string[] = []
    const errors: string[] = []

    for (const lead of leads) {
      const { firstName, lastName, email, phone, notes } = normalize(lead)

      if (!email && !phone && firstName === "Unknown") {
        errors.push("No usable contact data in lead")
        continue
      }

      try {
        let contact = email
          ? await db.contact.findUnique({ where: { email } })
          : null

        if (contact) {
          await db.contact.update({
            where: { id: contact.id },
            data: {
              phone: contact.phone ?? phone,
              notes: contact.notes ? contact.notes : notes,
            },
          })
        } else {
          contact = await db.contact.create({
            data: {
              firstName,
              lastName,
              email,
              phone,
              notes,
              leadSource: validSource,
              ownerId: ownerId ?? undefined,
            },
          })
        }

        await db.activity.create({
          data: {
            type: "CONTACT_CREATED",
            title: `Lead received via webhook (${validSource})`,
            contactId: contact.id,
          },
        })

        created.push(contact.id)
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e) {
    console.error("[webhook] Error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Facebook webhook verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ status: "not_configured" }, { status: 503 })
  }

  if (mode === "subscribe" && token === secret) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ status: "ok", message: "Travel CRM Webhook Endpoint" })
}
