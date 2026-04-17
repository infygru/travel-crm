"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Priority, TicketStatus, TicketCategory, TicketChannel } from "@prisma/client";

export async function getTickets(params?: {
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
  contactId?: string;
  search?: string;
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
  if (params?.priority) where.priority = params.priority;
  if (params?.category) where.category = params.category;
  if (params?.assigneeId) where.assigneeId = params.assigneeId;
  if (params?.contactId) where.contactId = params.contactId;
  if (params?.search) {
    where.OR = [
      { subject: { contains: params.search, mode: "insensitive" } },
      { ticketNumber: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [tickets, total] = await Promise.all([
    db.supportTicket.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.supportTicket.count({ where }),
  ]);

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTicketById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.supportTicket.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      createdBy: { select: { id: true, name: true } },
      booking: { select: { id: true, bookingRef: true, status: true } },
      deal: { select: { id: true, title: true, status: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      statusHistory: {
        include: {
          changedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      escalations: {
        include: {
          escalatedBy: { select: { id: true, name: true } },
          escalatedTo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createTicket(data: {
  subject: string;
  description: string;
  category: string;
  priority: string;
  channel?: string;
  contactId?: string;
  bookingId?: string;
  dealId?: string;
  assigneeId?: string;
  tags?: string[];
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const count = await db.supportTicket.count();
  const ticketNumber = `TKT-${String(count + 1).padStart(5, "0")}`;

  // Look up SLA config for this priority
  let slaDeadline: Date | undefined;
  try {
    const slaConfig = await db.slaConfig.findUnique({
      where: { priority: data.priority as Priority },
    });
    if (slaConfig) {
      slaDeadline = new Date(Date.now() + slaConfig.resolutionHours * 60 * 60 * 1000);
    }
  } catch {
    // No SLA config found, proceed without deadline
  }

  const ticket = await db.supportTicket.create({
    data: {
      ticketNumber,
      subject: data.subject,
      description: data.description,
      category: data.category as TicketCategory,
      priority: data.priority as Priority,
      channel: (data.channel as TicketChannel) ?? "MANUAL",
      contactId: data.contactId,
      bookingId: data.bookingId,
      dealId: data.dealId,
      assigneeId: data.assigneeId,
      tags: data.tags ?? [],
      slaDeadline,
      createdById: session.user.id,
    },
  });

  await db.ticketStatusHistory.create({
    data: {
      ticketId: ticket.id,
      toStatus: "OPEN",
      changedById: session.user.id,
    },
  });

  revalidatePath("/tickets");
  return ticket;
}

export async function changeTicketStatus(
  id: string,
  newStatus: string,
  reason?: string
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const ticket = await db.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new Error("Ticket not found");

  const updateData: Record<string, unknown> = {
    status: newStatus as TicketStatus,
  };

  if (newStatus === "RESOLVED" && !ticket.resolvedAt) {
    updateData.resolvedAt = new Date();
  }
  if (newStatus === "CLOSED" && !ticket.closedAt) {
    updateData.closedAt = new Date();
  }

  const [updated] = await Promise.all([
    db.supportTicket.update({
      where: { id },
      data: updateData,
    }),
    db.ticketStatusHistory.create({
      data: {
        ticketId: id,
        fromStatus: ticket.status,
        toStatus: newStatus as TicketStatus,
        changedById: session.user.id,
        reason,
      },
    }),
  ]);

  revalidatePath(`/tickets/${id}`);
  revalidatePath("/tickets");
  return updated;
}

export async function addTicketReply(
  ticketId: string,
  body: string,
  isInternal: boolean
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket not found");

  const reply = await db.ticketReply.create({
    data: {
      ticketId,
      body,
      isInternal,
      authorId: session.user.id,
    },
  });

  // Set firstResponseAt if not set and this is a public reply
  if (!ticket.firstResponseAt && !isInternal) {
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { firstResponseAt: new Date() },
    });
  }

  // Move ticket to IN_PROGRESS if it's still OPEN and this is a public reply
  if (ticket.status === "OPEN" && !isInternal) {
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" },
    });
    await db.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: "OPEN",
        toStatus: "IN_PROGRESS",
        changedById: session.user.id,
        reason: "First reply sent",
      },
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
  return reply;
}

export async function assignTicket(ticketId: string, assigneeId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data: { assigneeId },
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return ticket;
}

export async function escalateTicket(
  ticketId: string,
  escalatedToId: string,
  reason: string
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const escalation = await db.ticketEscalation.create({
    data: {
      ticketId,
      reason,
      escalatedById: session.user.id,
      escalatedToId,
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
  return escalation;
}

export async function getSlaConfigs() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.slaConfig.findMany({ orderBy: { priority: "asc" } });
}

export async function updateSlaConfig(
  priority: string,
  data: {
    firstResponseHours: number;
    resolutionHours: number;
    escalationAfterHours?: number;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.slaConfig.upsert({
    where: { priority: priority as Priority },
    create: {
      priority: priority as Priority,
      firstResponseHours: data.firstResponseHours,
      resolutionHours: data.resolutionHours,
      escalationAfterHours: data.escalationAfterHours,
    },
    update: {
      firstResponseHours: data.firstResponseHours,
      resolutionHours: data.resolutionHours,
      escalationAfterHours: data.escalationAfterHours,
    },
  });
}

export async function getTicketStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    openCount,
    inProgressCount,
    resolvedToday,
    slaBreachCount,
    totalResolved,
  ] = await Promise.all([
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    db.supportTicket.count({
      where: {
        status: "RESOLVED",
        resolvedAt: { gte: today, lt: tomorrow },
      },
    }),
    db.supportTicket.count({ where: { slaBreached: true } }),
    db.supportTicket.findMany({
      where: { status: { in: ["RESOLVED", "CLOSED"] }, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
  ]);

  let avgResolutionHours = 0;
  if (totalResolved.length > 0) {
    const totalMs = totalResolved.reduce((sum, t) => {
      const ms = (t.resolvedAt!.getTime() - t.createdAt.getTime());
      return sum + ms;
    }, 0);
    avgResolutionHours = Math.round(totalMs / totalResolved.length / (1000 * 60 * 60));
  }

  return {
    openCount,
    inProgressCount,
    resolvedToday,
    slaBreachCount,
    avgResolutionHours,
  };
}
