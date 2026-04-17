"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getTasks(params?: {
  status?: string;
  assigneeId?: string;
  type?: string;
  contactId?: string;
  dealId?: string;
  bookingId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
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
  if (params?.assigneeId) where.assigneeId = params.assigneeId;
  if (params?.type) where.type = params.type;
  if (params?.contactId) where.contactId = params.contactId;
  if (params?.dealId) where.dealId = params.dealId;
  if (params?.bookingId) where.bookingId = params.bookingId;

  if (params?.dueDateFrom || params?.dueDateTo) {
    where.dueDate = {
      ...(params.dueDateFrom && { gte: new Date(params.dueDateFrom) }),
      ...(params.dueDateTo && { lte: new Date(params.dueDateTo) }),
    };
  }

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        booking: { select: { id: true, bookingRef: true } },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      skip,
      take: limit,
    }),
    db.task.count({ where }),
  ]);

  return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTasksDueToday() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return db.task.findMany({
    where: {
      dueDate: { gte: today, lt: tomorrow },
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { priority: "desc" },
  });
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  type?: string;
  assigneeId?: string;
  contactId?: string;
  dealId?: string;
  bookingId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const task = await db.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: (data.priority as never) ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      type: (data.type as never) ?? "FOLLOW_UP",
      assigneeId: data.assigneeId ?? session.user.id,
      creatorId: session.user.id,
      contactId: data.contactId,
      dealId: data.dealId,
      bookingId: data.bookingId,
    },
  });

  await db.activity.create({
    data: {
      type: "TASK_CREATED",
      title: `Task "${data.title}" created`,
      contactId: data.contactId,
      dealId: data.dealId,
      bookingId: data.bookingId,
      userId: session.user.id,
    },
  });

  revalidatePath("/tasks");
  return task;
}

export async function updateTaskStatus(id: string, status: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const task = await db.task.update({
    where: { id },
    data: {
      status: status as never,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  if (status === "DONE") {
    await db.activity.create({
      data: {
        type: "TASK_COMPLETED",
        title: `Task "${task.title}" completed`,
        contactId: task.contactId ?? undefined,
        dealId: task.dealId ?? undefined,
        bookingId: task.bookingId ?? undefined,
        userId: session.user.id,
      },
    });
  }

  revalidatePath("/tasks");
  return task;
}

export async function updateTask(id: string, data: Partial<{
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  type: string;
  assigneeId: string;
}>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const task = await db.task.update({
    where: { id },
    data: {
      ...data,
      priority: data.priority as never,
      status: data.status as never,
      type: data.type as never,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      completedAt: data.status === "DONE" ? new Date() : data.status ? null : undefined,
      assigneeId: data.assigneeId || null,
    },
  });

  revalidatePath("/tasks");
  return task;
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  return { success: true };
}
