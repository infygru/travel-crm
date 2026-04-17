"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { triggerAutomations } from "@/lib/automations";

export async function getContacts(params?: {
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isActive: true };

  if (params?.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params?.status) where.leadStatus = params.status;
  if (params?.source) where.leadSource = params.source;
  if (params?.ownerId) where.ownerId = params.ownerId;

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { deals: true, bookings: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.contact.count({ where }),
  ]);

  return { contacts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getContactById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.contact.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      company: true,
      deals: {
        include: {
          stage: true,
          owner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      bookings: {
        include: {
          package: { select: { id: true, name: true } },
          agent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
      },
      activities: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      noteRels: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createContact(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  country?: string;
  city?: string;
  address?: string;
  leadSource?: string;
  leadStatus?: string;
  leadScore?: number;
  tags?: string[];
  companyId?: string;
  ownerId?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  preferredContact?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const contact = await db.contact.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      jobTitle: data.jobTitle,
      department: data.department,
      country: data.country,
      city: data.city,
      address: data.address,
      leadSource: data.leadSource as never,
      leadStatus: (data.leadStatus as never) ?? "NEW",
      leadScore: data.leadScore ?? 0,
      tags: data.tags ?? [],
      companyId: data.companyId,
      ownerId: data.ownerId ?? session.user.id,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      passportNumber: data.passportNumber,
      passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : undefined,
      nationality: data.nationality,
      preferredContact: data.preferredContact as never,
      notes: data.notes,
    },
  });

  await db.activity.create({
    data: {
      type: "CONTACT_CREATED",
      title: `Contact ${data.firstName} ${data.lastName} created`,
      contactId: contact.id,
      userId: session.user.id,
    },
  });

  revalidatePath("/contacts");

  // Fire automations non-blocking
  triggerAutomations("CONTACT_CREATED", {
    contactId: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? "",
    leadStatus: contact.leadStatus,
    userId: session.user.id,
  }).catch(() => {});

  return contact;
}

export async function updateContact(id: string, data: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  jobTitle: string;
  department: string;
  country: string;
  city: string;
  address: string;
  leadSource: string;
  leadStatus: string;
  leadScore: number;
  tags: string[];
  companyId: string;
  ownerId: string;
  notes: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  nationality: string;
  preferredContact: string;
  isActive: boolean;
}>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const contact = await db.contact.update({
    where: { id },
    data: {
      ...data,
      leadSource: data.leadSource as never,
      leadStatus: data.leadStatus as never,
      passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      preferredContact: data.preferredContact as never,
    },
  });

  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");

  if (data.leadStatus) {
    triggerAutomations("LEAD_STATUS_CHANGED", {
      contactId: id,
      leadStatus: data.leadStatus,
      userId: session.user.id,
    }).catch(() => {});
  }

  return contact;
}

export async function deleteContact(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.contact.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/contacts");
  return { success: true };
}

export async function addContactNote(contactId: string, content: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const note = await db.note.create({
    data: {
      content,
      contactId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  await db.activity.create({
    data: {
      type: "NOTE_ADDED",
      title: "Note added",
      contactId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  return note;
}

export async function getContactsCursor(params?: {
  cursor?: string;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const limit = params?.limit ?? 50;

  const where: Record<string, unknown> = { isActive: true };

  if (params?.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params?.status) where.leadStatus = params.status;
  if (params?.source) where.leadSource = params.source;
  if (params?.ownerId) where.ownerId = params.ownerId;

  const contacts = await db.contact.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      company: { select: { id: true, name: true } },
      _count: { select: { deals: true, bookings: true, tasks: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params?.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = contacts.length > limit;
  const data = hasMore ? contacts.slice(0, limit) : contacts;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  return { contacts: data, nextCursor, hasMore };
}

export async function getAgents() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });
}
