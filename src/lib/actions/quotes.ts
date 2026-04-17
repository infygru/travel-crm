"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function generateQuoteNumber(): Promise<string> {
  const count = await db.quote.count();
  const num = String(count + 1).padStart(4, "0");
  return `QT-${num}`;
}

export async function getQuotes(params?: {
  search?: string;
  status?: string;
  contactId?: string;
  dealId?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params?.status) where.status = params.status;
  if (params?.contactId) where.contactId = params.contactId;
  if (params?.dealId) where.dealId = params.dealId;
  if (params?.search) {
    where.OR = [
      { quoteNumber: { contains: params.search, mode: "insensitive" } },
      { title: { contains: params.search, mode: "insensitive" } },
      { contact: { firstName: { contains: params.search, mode: "insensitive" } } },
      { contact: { lastName: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [quotes, total] = await Promise.all([
    db.quote.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.quote.count({ where }),
  ]);

  return { quotes, total, page, limit };
}

export async function getQuote(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.quote.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      deal: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
      items: { orderBy: { order: "asc" } },
    },
  });
}

export async function getQuoteByShareToken(token: string) {
  return db.quote.findUnique({
    where: { shareToken: token },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      items: { orderBy: { order: "asc" } },
    },
  });
}

export async function createQuote(data: {
  title: string;
  contactId?: string;
  dealId?: string;
  currency?: string;
  validUntil?: string;
  notes?: string;
  terms?: string;
  items?: Array<{
    description: string;
    type?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const quoteNumber = await generateQuoteNumber();
  const items = data.items ?? [];

  const subtotal = items.reduce((s, item) => {
    const line = item.quantity * item.unitPrice;
    const disc = line * ((item.discount ?? 0) / 100);
    return s + line - disc;
  }, 0);

  const quote = await db.quote.create({
    data: {
      quoteNumber,
      title: data.title,
      contactId: data.contactId || undefined,
      dealId: data.dealId || undefined,
      createdById: session.user?.id,
      currency: data.currency ?? "INR",
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes || undefined,
      terms: data.terms || undefined,
      subtotal,
      totalAmount: subtotal,
      items: {
        create: items.map((item, idx) => ({
          order: idx + 1,
          description: item.description,
          type: item.type ?? "SERVICE",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          totalPrice:
            item.quantity * item.unitPrice -
            item.quantity * item.unitPrice * ((item.discount ?? 0) / 100),
          notes: item.notes || undefined,
        })),
      },
    },
    include: { items: true },
  });

  revalidatePath("/quotes");
  if (data.dealId) revalidatePath(`/deals/${data.dealId}`);
  return quote;
}

export async function updateQuoteItems(
  quoteId: string,
  items: Array<{
    id?: string;
    description: string;
    type?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const subtotal = items.reduce((s, item) => {
    const line = item.quantity * item.unitPrice;
    const disc = line * ((item.discount ?? 0) / 100);
    return s + line - disc;
  }, 0);

  await db.quoteItem.deleteMany({ where: { quoteId } });

  await db.quote.update({
    where: { id: quoteId },
    data: {
      subtotal,
      totalAmount: subtotal,
      updatedAt: new Date(),
      items: {
        create: items.map((item, idx) => ({
          order: idx + 1,
          description: item.description,
          type: item.type ?? "SERVICE",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          totalPrice:
            item.quantity * item.unitPrice -
            item.quantity * item.unitPrice * ((item.discount ?? 0) / 100),
          notes: item.notes || undefined,
        })),
      },
    },
  });

  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteDetails(
  quoteId: string,
  data: Partial<{
    title: string;
    validUntil: string;
    currency: string;
    notes: string;
    terms: string;
    discount: number;
    taxes: number;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const existing = await db.quote.findUnique({
    where: { id: quoteId },
    select: { subtotal: true },
  });
  if (!existing) throw new Error("Quote not found");

  const discount = data.discount ?? 0;
  const taxes = data.taxes ?? 0;
  const totalAmount = existing.subtotal - discount + taxes;

  await db.quote.update({
    where: { id: quoteId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
      ...(data.currency && { currency: data.currency }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.terms !== undefined && { terms: data.terms }),
      discount,
      taxes,
      totalAmount,
    },
  });

  revalidatePath(`/quotes/${quoteId}`);
}

export async function sendQuote(quoteId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const quote = await db.quote.update({
    where: { id: quoteId },
    data: {
      status: "SENT",
      sharedAt: new Date(),
    },
    include: {
      contact: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  return quote;
}

export async function acceptQuote(token: string) {
  const quote = await db.quote.findUnique({
    where: { shareToken: token },
    select: { id: true, status: true },
  });
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "SENT") throw new Error("Quote cannot be accepted in its current state");

  await db.quote.update({
    where: { id: quote.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  revalidatePath(`/quotes/${quote.id}`);
}

export async function declineQuote(token: string, reason?: string) {
  const quote = await db.quote.findUnique({
    where: { shareToken: token },
    select: { id: true, status: true },
  });
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "SENT") throw new Error("Quote cannot be declined in its current state");

  await db.quote.update({
    where: { id: quote.id },
    data: {
      status: "DECLINED",
      declinedAt: new Date(),
      declineReason: reason || undefined,
    },
  });

  revalidatePath(`/quotes/${quote.id}`);
}

export async function deleteQuote(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.quote.delete({ where: { id } });
  revalidatePath("/quotes");
}
