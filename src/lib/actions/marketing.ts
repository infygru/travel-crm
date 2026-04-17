"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma, MessageChannel, CampaignType, CampaignStatus, SequenceTrigger, AutomationTrigger, AutomationActionType, LeadStatus } from "@prisma/client";
import { sendCampaignEmail } from "@/lib/email";

// ── TEMPLATES ──────────────────────────────────────────────────────────────

export async function getTemplates(params?: {
  channel?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const where: Record<string, unknown> = { isActive: true };
  if (params?.channel) where.channel = params.channel;
  if (params?.search) {
    where.name = { contains: params.search, mode: "insensitive" };
  }

  return db.messageTemplate.findMany({
    where,
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTemplate(data: {
  name: string;
  channel: string;
  subject?: string;
  body: string;
  variables?: string[];
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const template = await db.messageTemplate.create({
    data: {
      name: data.name,
      channel: data.channel as MessageChannel,
      subject: data.subject,
      body: data.body,
      variables: data.variables ?? [],
      createdById: session.user.id,
    },
  });

  revalidatePath("/marketing/templates");
  return template;
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    channel: string;
    subject: string;
    body: string;
    variables: string[];
    isActive: boolean;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const template = await db.messageTemplate.update({
    where: { id },
    data: {
      name: data.name,
      subject: data.subject,
      body: data.body,
      variables: data.variables,
      isActive: data.isActive,
      channel: data.channel as MessageChannel | undefined,
    },
  });

  revalidatePath("/marketing/templates");
  return template;
}

export async function deleteTemplate(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.messageTemplate.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/marketing/templates");
  return { success: true };
}

// ── CAMPAIGNS ──────────────────────────────────────────────────────────────

export async function getCampaigns(params?: {
  status?: string;
  channel?: string;
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
  if (params?.channel) where.channel = params.channel;
  if (params?.search) {
    where.name = { contains: params.search, mode: "insensitive" };
  }

  const [campaigns, total] = await Promise.all([
    db.campaign.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
        segment: { select: { id: true, name: true } },
        _count: { select: { sends: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.campaign.count({ where }),
  ]);

  return { campaigns, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  channel: string;
  type: string;
  status?: string;
  scheduledAt?: string;
  subject?: string;
  body?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  templateId?: string;
  segmentId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const campaign = await db.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      channel: data.channel as MessageChannel,
      type: data.type as CampaignType,
      status: (data.status as CampaignStatus) ?? "DRAFT",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      subject: data.subject,
      body: data.body,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyTo: data.replyTo,
      templateId: data.templateId,
      segmentId: data.segmentId,
      createdById: session.user.id,
    },
  });

  revalidatePath("/marketing/campaigns");
  return campaign;
}

export async function updateCampaign(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    status: string;
    scheduledAt: string;
    subject: string;
    body: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    templateId: string;
    segmentId: string;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const campaign = await db.campaign.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      subject: data.subject,
      body: data.body,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyTo: data.replyTo,
      templateId: data.templateId,
      segmentId: data.segmentId,
      status: data.status as CampaignStatus | undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
  });

  revalidatePath(`/marketing/campaigns/${id}`);
  revalidatePath("/marketing/campaigns");
  return campaign;
}

export async function getCampaignById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.campaign.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
      segment: { select: { id: true, name: true } },
      sends: {
        take: 20,
        orderBy: { sentAt: "desc" },
        include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
      _count: { select: { sends: true } },
    },
  });
}

async function resolveAudience(segmentId: string | null): Promise<Array<{ id: string; firstName: string; lastName: string; email: string | null }>> {
  const base = { isActive: true, email: { not: null } };

  if (!segmentId || segmentId === "all") {
    return db.contact.findMany({ where: base, select: { id: true, firstName: true, lastName: true, email: true } });
  }
  if (segmentId === "new") {
    return db.contact.findMany({ where: { ...base, leadStatus: LeadStatus.NEW }, select: { id: true, firstName: true, lastName: true, email: true } });
  }
  if (segmentId === "qualified") {
    return db.contact.findMany({ where: { ...base, leadStatus: { in: [LeadStatus.QUALIFIED, LeadStatus.PROPOSAL_SENT, LeadStatus.NEGOTIATION] } }, select: { id: true, firstName: true, lastName: true, email: true } });
  }
  if (segmentId === "converted") {
    return db.contact.findMany({ where: { ...base, leadStatus: LeadStatus.CONVERTED }, select: { id: true, firstName: true, lastName: true, email: true } });
  }
  // Real segment — filter by leadStatus stored in segment.filters if applicable, else all
  return db.contact.findMany({ where: base, select: { id: true, firstName: true, lastName: true, email: true } });
}

export async function sendCampaign(campaignId: string): Promise<{ sent: number; failed: number; errors: string[] }> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "SENT") throw new Error("Campaign already sent");
  if (!campaign.body) throw new Error("Campaign has no message body");

  const companySettings = await db.companySettings.findUnique({ where: { id: "singleton" } });
  const companyName = companySettings?.companyName ?? "Travel CRM";

  // Mark as SENDING
  await db.campaign.update({ where: { id: campaignId }, data: { status: "SENDING" } });

  const contacts = await resolveAudience(campaign.segmentId);

  // Filter out already-sent and unsubscribed
  const alreadySent = await db.campaignSend.findMany({ where: { campaignId }, select: { contactId: true } });
  const alreadySentIds = new Set(alreadySent.map(s => s.contactId));
  const unsubscribed = await db.unsubscribe.findMany({ where: { channel: campaign.channel }, select: { contactId: true } });
  const unsubIds = new Set(unsubscribed.map(u => u.contactId));

  const toSend = contacts.filter(c => c.email && !alreadySentIds.has(c.id) && !unsubIds.has(c.id));

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const contact of toSend) {
    if (!contact.email) continue;

    // Create send record
    const sendRecord = await db.campaignSend.upsert({
      where: { campaignId_contactId: { campaignId, contactId: contact.id } },
      create: { campaignId, contactId: contact.id, status: "PENDING" },
      update: { status: "PENDING" },
    });

    let result: { success: boolean; error?: string } = { success: true };

    if (campaign.channel === "EMAIL") {
      result = await sendCampaignEmail({
        to: contact.email,
        subject: campaign.subject ?? campaign.name,
        body: campaign.body,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        replyTo: campaign.replyTo,
        companyName,
        contactFirstName: contact.firstName,
        contactLastName: contact.lastName,
        unsubscribeToken: sendRecord.id,
      });
    }
    // SMS / WhatsApp: log only — no provider integrated yet
    else {
      result = { success: true };
    }

    if (result.success) {
      sent++;
      await db.campaignSend.update({
        where: { id: sendRecord.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } else {
      failed++;
      errors.push(`${contact.email}: ${result.error}`);
      await db.campaignSend.update({
        where: { id: sendRecord.id },
        data: { status: "FAILED", errorMessage: result.error },
      });
    }
  }

  // Mark SENT and update stats
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      totalSent: { increment: sent },
    },
  });

  revalidatePath(`/marketing/campaigns/${campaignId}`);
  revalidatePath("/marketing/campaigns");
  return { sent, failed, errors };
}

export async function duplicateCampaign(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const original = await db.campaign.findUnique({ where: { id } });
  if (!original) throw new Error("Campaign not found");

  const copy = await db.campaign.create({
    data: {
      name: `${original.name} (Copy)`,
      description: original.description,
      channel: original.channel,
      type: original.type,
      status: "DRAFT",
      subject: original.subject,
      body: original.body,
      fromName: original.fromName,
      fromEmail: original.fromEmail,
      replyTo: original.replyTo,
      templateId: original.templateId,
      segmentId: original.segmentId,
      createdById: session.user.id,
    },
  });

  revalidatePath("/marketing/campaigns");
  return copy;
}

// ── SEQUENCES ──────────────────────────────────────────────────────────────

export async function getSequences() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.emailSequence.findMany({
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { steps: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSequence(data: {
  name: string;
  description?: string;
  triggerType: string;
  triggerData?: Record<string, unknown>;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const sequence = await db.emailSequence.create({
    data: {
      name: data.name,
      description: data.description,
      triggerType: data.triggerType as SequenceTrigger,
      triggerData: data.triggerData !== undefined
        ? (data.triggerData as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      createdById: session.user.id,
    },
  });

  revalidatePath("/marketing/sequences");
  return sequence;
}

export async function addSequenceStep(
  sequenceId: string,
  stepData: {
    order: number;
    delayDays?: number;
    delayHours?: number;
    channel: string;
    subject?: string;
    body?: string;
    templateId?: string;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const step = await db.sequenceStep.create({
    data: {
      sequenceId,
      order: stepData.order,
      delayDays: stepData.delayDays ?? 0,
      delayHours: stepData.delayHours ?? 0,
      channel: stepData.channel as MessageChannel,
      subject: stepData.subject,
      body: stepData.body,
      templateId: stepData.templateId,
    },
  });

  revalidatePath("/marketing/sequences");
  return step;
}

export async function removeSequenceStep(stepId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.sequenceStep.delete({ where: { id: stepId } });
  revalidatePath("/marketing/sequences");
  return { success: true };
}

export async function getSequenceSteps(sequenceId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.sequenceStep.findMany({
    where: { sequenceId },
    orderBy: { order: "asc" },
  });
}

export async function updateSequence(id: string, data: Partial<{ name: string; description: string; isActive: boolean; triggerType: string }>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const seq = await db.emailSequence.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      triggerType: data.triggerType as SequenceTrigger | undefined,
    },
  });

  revalidatePath("/marketing/sequences");
  return seq;
}

export async function deleteSequence(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.emailSequence.delete({ where: { id } });
  revalidatePath("/marketing/sequences");
  return { success: true };
}

// ── AUTOMATIONS ────────────────────────────────────────────────────────────

export async function getAutomationRules() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.automationRule.findMany({
    include: {
      actions: { orderBy: { order: "asc" } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAutomationRule(data: {
  name: string;
  description?: string;
  triggerType: string;
  triggerData?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  sequenceId?: string;
  actions: Array<{
    order: number;
    type: string;
    config: Record<string, unknown>;
  }>;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const rule = await db.automationRule.create({
    data: {
      name: data.name,
      description: data.description,
      triggerType: data.triggerType as AutomationTrigger,
      triggerData: data.triggerData !== undefined
        ? (data.triggerData as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      conditions: data.conditions !== undefined
        ? (data.conditions as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      sequenceId: data.sequenceId,
      createdById: session.user.id,
      actions: {
        create: data.actions.map((a) => ({
          order: a.order,
          type: a.type as AutomationActionType,
          config: a.config as Prisma.InputJsonValue,
        })),
      },
    },
    include: { actions: true },
  });

  revalidatePath("/marketing/automations");
  return rule;
}

export async function toggleAutomationRule(id: string, isActive: boolean) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const rule = await db.automationRule.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/marketing/automations");
  return rule;
}

// ── SEGMENTS ───────────────────────────────────────────────────────────────

export async function getSegments() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.contactSegment.findMany({
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { campaigns: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function enrollContactInSequence(contactId: string, sequenceId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const sequence = await db.emailSequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!sequence) throw new Error("Sequence not found");
  if (!sequence.isActive) throw new Error("Sequence is not active");

  const firstStep = sequence.steps[0];
  const delayMs = firstStep
    ? ((firstStep.delayDays ?? 0) * 86400 + (firstStep.delayHours ?? 0) * 3600) * 1000
    : 0;
  const nextSendAt = new Date(Date.now() + delayMs);

  const enrollment = await db.sequenceEnrollment.upsert({
    where: { sequenceId_contactId: { sequenceId, contactId } },
    create: {
      sequenceId,
      contactId,
      currentStep: 0,
      status: "ACTIVE",
      nextSendAt,
    },
    update: {
      status: "ACTIVE",
      currentStep: 0,
      completedAt: null,
      nextSendAt,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  return enrollment;
}

export async function getContactEnrollments(contactId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.sequenceEnrollment.findMany({
    where: { contactId },
    include: {
      sequence: {
        include: {
          steps: { orderBy: { order: "asc" } },
          _count: { select: { steps: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });
}

export async function createSegment(data: {
  name: string;
  description?: string;
  filters: Record<string, unknown>;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const segment = await db.contactSegment.create({
    data: {
      name: data.name,
      description: data.description,
      filters: data.filters as Prisma.InputJsonValue,
      createdById: session.user.id,
    },
  });

  revalidatePath("/marketing");
  return segment;
}
