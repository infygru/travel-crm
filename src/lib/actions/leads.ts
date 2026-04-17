"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma, ScoringRuleType, AssignmentType, LeadSource } from "@prisma/client";

// ── SCORING RULES ──────────────────────────────────────────────────────────

export async function getScoringRules() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.leadScoringRule.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createScoringRule(data: {
  name: string;
  description?: string;
  ruleType: string;
  conditions: Record<string, unknown>;
  scorePoints: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const rule = await db.leadScoringRule.create({
    data: {
      name: data.name,
      description: data.description,
      ruleType: data.ruleType as ScoringRuleType,
      conditions: data.conditions as Prisma.InputJsonValue,
      scorePoints: data.scorePoints,
    },
  });

  revalidatePath("/leads/scoring");
  return rule;
}

export async function updateScoringRule(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    ruleType: string;
    conditions: Record<string, unknown>;
    scorePoints: number;
    isActive: boolean;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const rule = await db.leadScoringRule.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      scorePoints: data.scorePoints,
      isActive: data.isActive,
      ruleType: data.ruleType as ScoringRuleType | undefined,
      conditions: data.conditions !== undefined
        ? (data.conditions as Prisma.InputJsonValue)
        : undefined,
    },
  });

  revalidatePath("/leads/scoring");
  return rule;
}

export async function deleteScoringRule(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.leadScoringRule.delete({ where: { id } });
  revalidatePath("/leads/scoring");
  return { success: true };
}

export async function getLeadScoreHistory(contactId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.leadScoreHistory.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ── ASSIGNMENT RULES ───────────────────────────────────────────────────────

export async function getAssignmentRules() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.leadAssignmentRule.findMany({ orderBy: { order: "asc" } });
}

export async function createAssignmentRule(data: {
  name: string;
  type: string;
  conditions?: Record<string, unknown>;
  config: Record<string, unknown>;
  order?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const maxOrder = await db.leadAssignmentRule.aggregate({
    _max: { order: true },
  });

  const rule = await db.leadAssignmentRule.create({
    data: {
      name: data.name,
      type: data.type as AssignmentType,
      conditions: data.conditions !== undefined
        ? (data.conditions as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      config: data.config as Prisma.InputJsonValue,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/leads");
  return rule;
}

export async function updateAssignmentRule(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    conditions: Record<string, unknown>;
    config: Record<string, unknown>;
    isActive: boolean;
    order: number;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const rule = await db.leadAssignmentRule.update({
    where: { id },
    data: {
      name: data.name,
      isActive: data.isActive,
      order: data.order,
      type: data.type as AssignmentType | undefined,
      conditions: data.conditions !== undefined
        ? (data.conditions as Prisma.InputJsonValue)
        : undefined,
      config: data.config !== undefined
        ? (data.config as Prisma.InputJsonValue)
        : undefined,
    },
  });

  revalidatePath("/leads");
  return rule;
}

// ── WEB LEAD FORMS ─────────────────────────────────────────────────────────

export async function getForms() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.webLeadForm.findMany({
    include: {
      defaultOwner: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFormById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.webLeadForm.findUnique({
    where: { id },
    include: {
      submissions: {
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function createForm(data: {
  name: string;
  title?: string;
  description?: string;
  fields: Array<{ key: string; label: string; type: string; required: boolean }>;
  defaultTags?: string[];
  defaultSource?: string;
  defaultOwnerId?: string;
  redirectUrl?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const form = await db.webLeadForm.create({
    data: {
      name: data.name,
      title: data.title,
      description: data.description,
      fields: data.fields as Prisma.InputJsonValue,
      defaultTags: data.defaultTags ?? [],
      defaultSource: data.defaultSource as LeadSource | undefined,
      defaultOwnerId: data.defaultOwnerId ?? session.user.id,
      redirectUrl: data.redirectUrl,
    },
  });

  revalidatePath("/leads/forms");
  return form;
}

export async function updateForm(
  id: string,
  data: Partial<{
    name: string;
    title: string;
    description: string;
    fields: Array<{ key: string; label: string; type: string; required: boolean }>;
    defaultTags: string[];
    defaultSource: string;
    defaultOwnerId: string;
    redirectUrl: string;
    isActive: boolean;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const form = await db.webLeadForm.update({
    where: { id },
    data: {
      name: data.name,
      title: data.title,
      description: data.description,
      defaultTags: data.defaultTags,
      defaultOwnerId: data.defaultOwnerId,
      redirectUrl: data.redirectUrl,
      isActive: data.isActive,
      defaultSource: data.defaultSource as LeadSource | undefined,
      fields: data.fields !== undefined
        ? (data.fields as Prisma.InputJsonValue)
        : undefined,
    },
  });

  revalidatePath("/leads/forms");
  return form;
}

export async function getPublicForm(embedToken: string) {
  // No auth - public route
  return db.webLeadForm.findUnique({
    where: { embedToken, isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      fields: true,
      embedToken: true,
      redirectUrl: true,
    },
  });
}

export async function submitWebLeadForm(
  embedToken: string,
  formData: Record<string, string>
) {
  // No auth - public route
  const form = await db.webLeadForm.findUnique({
    where: { embedToken, isActive: true },
  });
  if (!form) throw new Error("Form not found");

  // Try to create contact from form data
  let contactId: string | undefined;
  try {
    if (formData.email || formData.firstName) {
      const contact = await db.contact.create({
        data: {
          firstName: formData.firstName ?? "Unknown",
          lastName: formData.lastName ?? "",
          email: formData.email,
          phone: formData.phone,
          notes: formData.message,
          leadSource: form.defaultSource ?? undefined,
          tags: form.defaultTags,
          ownerId: form.defaultOwnerId ?? undefined,
        },
      });
      contactId = contact.id;
    }
  } catch {
    // Contact may already exist with same email
  }

  await db.webLeadSubmission.create({
    data: {
      formId: form.id,
      data: formData as Prisma.InputJsonValue,
      status: contactId ? "CONVERTED" : "PENDING",
      contactId,
      processedAt: contactId ? new Date() : undefined,
    },
  });

  // Increment submission count
  await db.webLeadForm.update({
    where: { id: form.id },
    data: { submissionCount: { increment: 1 } },
  });

  return { success: true, contactId };
}

// ── ANALYTICS ──────────────────────────────────────────────────────────────

export async function getLeadAnalytics() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const [
    bySource,
    byStatus,
    totalContacts,
    avgScoreAgg,
    convertedCount,
  ] = await Promise.all([
    db.contact.groupBy({
      by: ["leadSource"],
      _count: true,
      where: { isActive: true, leadSource: { not: null } },
    }),
    db.contact.groupBy({
      by: ["leadStatus"],
      _count: true,
      where: { isActive: true },
    }),
    db.contact.count({ where: { isActive: true } }),
    db.contact.aggregate({
      _avg: { leadScore: true },
      where: { isActive: true },
    }),
    db.contact.count({ where: { isActive: true, leadStatus: "CONVERTED" } }),
  ]);

  const conversionRate = totalContacts > 0
    ? Math.round((convertedCount / totalContacts) * 100)
    : 0;

  return {
    bySource,
    byStatus,
    totalContacts,
    avgScore: Math.round(avgScoreAgg._avg.leadScore ?? 0),
    conversionRate,
    convertedCount,
  };
}
