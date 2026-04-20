import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateTwilioSignature } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = `${req.nextUrl.origin}/api/webhooks/twilio`;

  if (process.env.NODE_ENV === "production" && !validateTwilioSignature(url, params, signature)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const from: string = params.From ?? "";
  const messageBody: string = params.Body ?? "";
  const twilioSid: string = params.MessageSid ?? "";

  // Determine channel from 'From' prefix
  const isWhatsApp = from.startsWith("whatsapp:");
  const channel = isWhatsApp ? "WHATSAPP" : "SMS";
  const phoneNumber = isWhatsApp ? from.replace("whatsapp:", "") : from;

  // Find contact by phone/mobile
  const contact = await db.contact.findFirst({
    where: {
      OR: [
        { phone: phoneNumber },
        { mobile: phoneNumber },
      ],
    },
  });

  if (!contact) {
    // Return 200 to Twilio so it doesn't retry, but we ignore unknown senders
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Find or create conversation
  let conversation = await db.conversation.findFirst({
    where: {
      contactId: contact.id,
      channel,
      status: { not: "RESOLVED" },
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        channel,
        contactId: contact.id,
        externalId: twilioSid,
        status: "OPEN",
        lastMessageAt: new Date(),
      },
    });
  }

  // Create inbound message
  await db.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      body: messageBody,
      status: "DELIVERED",
      twilioSid,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
