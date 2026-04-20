"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendWhatsApp, sendSMS } from "@/lib/twilio";

export async function getConversations(params?: {
  channel?: string;
  status?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {};

  if (params?.channel) where.channel = params.channel;
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.contact = {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search } },
        { mobile: { contains: params.search } },
      ],
    };
  }

  return db.conversation.findMany({
    where,
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, phone: true, mobile: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true } },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getConversationById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.conversation.findUnique({
    where: { id },
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true, phone: true, mobile: true, avatarUrl: true, email: true },
      },
      assignedTo: { select: { id: true, name: true } },
      messages: {
        include: {
          sentBy: { select: { id: true, name: true, image: true } },
        },
        orderBy: { sentAt: "asc" },
      },
    },
  });
}

export async function sendMessage(conversationId: string, body: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { contact: true },
  });
  if (!conversation) throw new Error("Conversation not found");

  const toNumber = conversation.contact.mobile ?? conversation.contact.phone;
  if (!toNumber) throw new Error("Contact has no phone number");

  let twilioSid: string | undefined;

  try {
    if (conversation.channel === "WHATSAPP") {
      twilioSid = await sendWhatsApp(toNumber, body);
    } else if (conversation.channel === "SMS") {
      twilioSid = await sendSMS(toNumber, body);
    }
  } catch (err) {
    // Log error but still save message as FAILED
    console.error("Twilio send error:", err);
  }

  const message = await db.conversationMessage.create({
    data: {
      conversationId,
      direction: "OUTBOUND",
      body,
      status: twilioSid ? "SENT" : "FAILED",
      twilioSid,
      sentById: session.user.id,
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");

  return message;
}

export async function resolveConversation(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.conversation.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  revalidatePath(`/inbox/${id}`);
  revalidatePath("/inbox");
}

export async function assignConversation(id: string, userId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.conversation.update({
    where: { id },
    data: { assignedToId: userId },
  });

  revalidatePath(`/inbox/${id}`);
  revalidatePath("/inbox");
}
