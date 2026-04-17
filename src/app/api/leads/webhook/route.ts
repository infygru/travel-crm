import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";

// Generic webhook endpoint for lead ingestion
// Accepts: Google Ads lead forms, Facebook Lead Ads, Zapier, Make.com, or any webhook
//
// Usage:
//   POST /api/leads/webhook?source=GOOGLE_ADS&apiKey=YOUR_KEY
//   POST /api/leads/webhook?source=FACEBOOK&apiKey=YOUR_KEY
//   POST /api/leads/webhook?source=WEBSITE&apiKey=YOUR_KEY
//
// Body (any of these field names are auto-mapped):
//   firstName / first_name / fname / full_name / name
//   lastName / last_name / lname
//   email / email_address
//   phone / phone_number / mobile
//   message / notes / description / inquiry
//   destination / travel_destination / interest
//   budget / travel_budget
//   travel_date / departure_date / date

function normalize(body: Record<string, unknown>) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== "") return String(body[k]);
    }
    return undefined;
  };

  // Handle "full_name" by splitting on first space
  let firstName = get("firstName", "first_name", "fname");
  let lastName = get("lastName", "last_name", "lname");

  if (!firstName) {
    const fullName = get("full_name", "name", "contact_name");
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(" ") || undefined;
    }
  }

  // Facebook Lead Ads sends field_data array
  if (!firstName && Array.isArray(body.field_data)) {
    const fieldData = body.field_data as Array<{ name: string; values: string[] }>;
    const byName = Object.fromEntries(fieldData.map((f) => [f.name.toLowerCase(), f.values?.[0]]));
    firstName = byName["first_name"] ?? byName["full_name"]?.split(" ")[0];
    lastName = (byName["last_name"] ?? byName["full_name"]?.split(" ").slice(1).join(" ")) || undefined;
    if (!firstName && byName["full_name"]) firstName = byName["full_name"];
  }

  const email = get("email", "email_address");
  const phone = get("phone", "phone_number", "mobile", "contact_phone");
  const message = get("message", "notes", "description", "inquiry", "questions", "comment");
  const destination = get("destination", "travel_destination", "interest", "package");
  const budget = get("budget", "travel_budget", "max_budget");
  const travelDate = get("travel_date", "departure_date", "date", "travel_month");

  // Build notes from extra travel fields
  const extraNotes = [
    destination ? `Destination: ${destination}` : null,
    budget ? `Budget: ${budget}` : null,
    travelDate ? `Travel Date: ${travelDate}` : null,
    message ? `Message: ${message}` : null,
  ].filter(Boolean).join("\n");

  return {
    firstName: firstName ?? "Unknown",
    lastName: lastName ?? "",
    email,
    phone,
    notes: extraNotes || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source") ?? "WEBSITE";
    const apiKey = searchParams.get("apiKey");
    const ownerId = searchParams.get("ownerId") ?? undefined;

    // Validate API key — must match WEBHOOK_SECRET env var
    const secret = process.env.WEBHOOK_SECRET;
    if (secret && apiKey !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Facebook sends a verification challenge on setup
    if (body["hub.mode"] === "subscribe") {
      return new NextResponse(String(body["hub.challenge"]), { status: 200 });
    }

    // Facebook wraps leads in entry > changes > value > leads[]
    let leads: Record<string, unknown>[] = [body];
    if (Array.isArray(body.entry)) {
      leads = [];
      for (const entry of body.entry as Array<{ changes?: Array<{ value?: { leads?: unknown[] } }> }>) {
        for (const change of entry.changes ?? []) {
          if (Array.isArray(change.value?.leads)) {
            leads.push(...(change.value.leads as Record<string, unknown>[]));
          }
        }
      }
      if (leads.length === 0) leads = [body]; // fallback to whole body
    }

    const created: string[] = [];
    const errors: string[] = [];

    for (const lead of leads) {
      const { firstName, lastName, email, phone, notes } = normalize(lead);

      if (!email && !phone && firstName === "Unknown") {
        errors.push("No usable contact data in lead");
        continue;
      }

      try {
        // Upsert by email or create fresh
        let contact = email
          ? await db.contact.findUnique({ where: { email } })
          : null;

        if (contact) {
          // Update existing — fill in missing phone/notes
          await db.contact.update({
            where: { id: contact.id },
            data: {
              phone: contact.phone ?? phone,
              notes: contact.notes ? contact.notes : notes,
            },
          });
        } else {
          contact = await db.contact.create({
            data: {
              firstName,
              lastName,
              email,
              phone,
              notes,
              leadSource: source as never,
              ownerId: ownerId ?? undefined,
            },
          });
        }

        // Log activity
        await db.activity.create({
          data: {
            type: "CONTACT_CREATED",
            title: `Lead received via webhook (${source})`,
            contactId: contact.id,
          },
        });

        created.push(contact.id);
      } catch (e) {
        errors.push(String(e));
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    console.error("[webhook] Error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Facebook webhook verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === (process.env.WEBHOOK_SECRET ?? "travel_crm_verify")) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "ok", message: "Travel CRM Webhook Endpoint" });
}
