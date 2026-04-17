"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { triggerAutomations } from "@/lib/automations";

export async function getDeals(params?: {
  pipelineId?: string;
  ownerId?: string;
  status?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {};

  if (params?.pipelineId) where.pipelineId = params.pipelineId;
  if (params?.ownerId) where.ownerId = params.ownerId;
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const deals = await db.deal.findMany({
    where,
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      company: { select: { id: true, name: true } },
      stage: true,
      pipeline: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, image: true } },
      package: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return deals;
}

export async function getDealById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.deal.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
      company: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true, color: true, probability: true } },
      pipeline: { select: { id: true, name: true, stages: { orderBy: { order: "asc" }, select: { id: true, name: true, color: true, probability: true } } } },
      owner: { select: { id: true, name: true, image: true, email: true } },
      package: { select: { id: true, name: true, basePrice: true, currency: true } },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
      },
      notes: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      bookings: {
        select: { id: true, bookingRef: true, status: true, totalAmount: true, startDate: true, endDate: true },
        orderBy: { createdAt: "desc" },
      },
      itineraries: {
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getDealsByPipeline(pipelineId?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const pipeline = await db.pipeline.findFirst({
    where: pipelineId ? { id: pipelineId } : { isDefault: true },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          deals: {
            include: {
              contact: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
              owner: { select: { id: true, name: true, image: true } },
              _count: { select: { tasks: true } },
            },
            where: { status: "OPEN" },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return pipeline;
}

export async function getPipelines() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.pipeline.findMany({
    include: {
      stages: { orderBy: { order: "asc" } },
      _count: { select: { deals: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createDeal(data: {
  title: string;
  value?: number;
  currency?: string;
  probability?: number;
  expectedClose?: string;
  priority?: string;
  description?: string;
  tags?: string[];
  pipelineId?: string;
  stageId?: string;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  packageId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  let stageId = data.stageId;
  let pipelineId = data.pipelineId;

  if (!stageId) {
    const defaultPipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { order: "asc" }, take: 1 } },
    });
    if (defaultPipeline?.stages[0]) {
      stageId = defaultPipeline.stages[0].id;
      pipelineId = defaultPipeline.id;
    }
  }

  const deal = await db.deal.create({
    data: {
      title: data.title,
      value: data.value ?? 0,
      currency: data.currency ?? "INR",
      probability: data.probability ?? 0,
      expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
      priority: (data.priority as never) ?? "MEDIUM",
      description: data.description,
      tags: data.tags ?? [],
      pipelineId,
      stageId,
      contactId: data.contactId,
      companyId: data.companyId,
      ownerId: data.ownerId ?? session.user.id,
      packageId: data.packageId,
    },
  });

  await db.activity.create({
    data: {
      type: "DEAL_CREATED",
      title: `Deal "${data.title}" created`,
      dealId: deal.id,
      contactId: data.contactId,
      userId: session.user.id,
    },
  });

  revalidatePath("/deals");

  triggerAutomations("DEAL_CREATED", {
    dealId: deal.id,
    contactId: data.contactId,
    dealTitle: data.title,
    dealValue: data.value ?? 0,
    userId: session.user.id,
  }).catch(() => {});

  return deal;
}

export async function updateDealStage(dealId: string, stageId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const stage = await db.pipelineStage.findUnique({ where: { id: stageId } });
  if (!stage) throw new Error("Stage not found");

  const deal = await db.deal.update({
    where: { id: dealId },
    data: { stageId, probability: stage.probability },
  });

  await db.activity.create({
    data: {
      type: "DEAL_STAGE_CHANGED",
      title: `Deal moved to "${stage.name}"`,
      dealId: dealId,
      userId: session.user.id,
      metadata: { stageId, stageName: stage.name },
    },
  });

  triggerAutomations("DEAL_STAGE_CHANGED", {
    dealId: dealId,
    stageId,
    stageName: stage.name,
    userId: session.user.id,
  }).catch(() => {});

  revalidatePath("/deals");
  return deal;
}

export async function updateDeal(id: string, data: Partial<{
  title: string;
  value: number;
  currency: string;
  probability: number;
  expectedClose: string;
  priority: string;
  description: string;
  status: string;
  lostReason: string;
  tags: string[];
  stageId: string;
  ownerId: string;
}>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const deal = await db.deal.update({
    where: { id },
    data: {
      ...data,
      priority: data.priority as never,
      status: data.status as never,
      expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
      actualClose: data.status === "WON" || data.status === "LOST" ? new Date() : undefined,
    },
  });

  if (data.status === "WON") {
    await db.activity.create({
      data: {
        type: "DEAL_WON",
        title: `Deal "${deal.title}" marked as Won`,
        dealId: id,
        userId: session.user.id,
      },
    });
    triggerAutomations("DEAL_WON", {
      dealId: id,
      dealTitle: deal.title,
      contactId: deal.contactId ?? undefined,
      userId: session.user.id,
    }).catch(() => {});
  } else if (data.status === "LOST") {
    await db.activity.create({
      data: {
        type: "DEAL_LOST",
        title: `Deal "${deal.title}" marked as Lost`,
        dealId: id,
        userId: session.user.id,
        metadata: { reason: data.lostReason },
      },
    });
    triggerAutomations("DEAL_LOST", {
      dealId: id,
      dealTitle: deal.title,
      contactId: deal.contactId ?? undefined,
      userId: session.user.id,
    }).catch(() => {});
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return deal;
}

export async function addDealNote(dealId: string, content: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const note = await db.note.create({
    data: {
      content,
      dealId,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/deals/${dealId}`);
  return note;
}

export async function addDealTask(dealId: string, data: {
  title: string;
  type: string;
  priority: string;
  dueDate?: string;
  description?: string;
  contactId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const task = await db.task.create({
    data: {
      title: data.title,
      type: data.type as never,
      priority: data.priority as never,
      status: "TODO",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      description: data.description,
      dealId,
      contactId: data.contactId,
      assigneeId: session.user.id,
    },
  });

  await db.activity.create({
    data: {
      type: "TASK_CREATED",
      title: `Task "${data.title}" created`,
      dealId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/deals/${dealId}`);
  return task;
}

export async function deleteDeal(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.deal.delete({ where: { id } });
  revalidatePath("/deals");
  return { success: true };
}
