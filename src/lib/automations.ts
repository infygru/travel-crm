/**
 * Automation engine — evaluates and fires automation rules.
 * This is a plain server-side module (no "use server" directive)
 * so it can be imported by other server action files without issues.
 */

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type AutomationPayload = Record<string, unknown>;

function evaluateConditions(conditions: unknown, payload: AutomationPayload): boolean {
  if (!conditions || typeof conditions !== "object") return true;

  const conds = conditions as Record<string, unknown>;

  // Simple flat key-value matching: { "leadStatus": "NEW", "country": "India" }
  // All conditions must match (AND semantics)
  for (const [key, expected] of Object.entries(conds)) {
    const actual = payload[key];
    if (actual !== expected) return false;
  }
  return true;
}

export async function triggerAutomations(
  event: string,
  payload: AutomationPayload
): Promise<void> {
  try {
    const rules = await db.automationRule.findMany({
      where: { isActive: true, triggerType: event as never },
      include: { actions: { orderBy: { order: "asc" } } },
    });

    for (const rule of rules) {
      if (!evaluateConditions(rule.conditions, payload)) continue;

      for (const action of rule.actions) {
        try {
          await executeAction(action.type as string, action.config as Record<string, unknown>, payload);
        } catch (err) {
          console.error(`[automations] action ${action.type} failed for rule ${rule.id}:`, err);
        }
      }
    }
  } catch (err) {
    // Never throw — automations are fire-and-forget
    console.error("[automations] triggerAutomations error:", err);
  }
}

async function executeAction(
  type: string,
  config: Record<string, unknown>,
  payload: AutomationPayload
): Promise<void> {
  const contactId = payload.contactId as string | undefined;
  const dealId = payload.dealId as string | undefined;

  switch (type) {
    case "SEND_EMAIL": {
      if (!config.to && !contactId) break;

      let toEmail = config.to as string | undefined;
      let toName = "";

      if (!toEmail && contactId) {
        const contact = await db.contact.findUnique({
          where: { id: contactId },
          select: { email: true, firstName: true, lastName: true },
        });
        if (!contact?.email) break;
        toEmail = contact.email;
        toName = `${contact.firstName} ${contact.lastName}`;
      }

      if (!toEmail) break;

      await sendEmail({
        to: toEmail,
        subject: interpolate(String(config.subject ?? "Message from us"), payload, toName),
        html: `<p>${interpolate(String(config.body ?? ""), payload, toName).replace(/\n/g, "<br>")}</p>`,
      });
      break;
    }

    case "ASSIGN_TASK": {
      const targetContactId = contactId;
      const targetDealId = dealId;
      if (!targetContactId && !targetDealId) break;

      await db.task.create({
        data: {
          title: String(config.title ?? "Follow up"),
          type: (config.taskType as never) ?? "FOLLOW_UP",
          priority: (config.priority as never) ?? "MEDIUM",
          status: "TODO",
          dueDate: config.dueDays
            ? new Date(Date.now() + Number(config.dueDays) * 86400000)
            : undefined,
          description: config.description ? String(config.description) : undefined,
          contactId: targetContactId,
          dealId: targetDealId,
          assigneeId: (config.assigneeId as string | undefined) ?? (payload.userId as string | undefined),
        },
      });
      break;
    }

    case "CHANGE_LEAD_STATUS": {
      if (!contactId || !config.status) break;
      await db.contact.update({
        where: { id: contactId },
        data: { leadStatus: config.status as never },
      });
      break;
    }

    case "ADD_TAG": {
      if (!contactId || !config.tag) break;
      const contact = await db.contact.findUnique({ where: { id: contactId }, select: { tags: true } });
      if (!contact) break;
      const tag = String(config.tag);
      if (!contact.tags.includes(tag)) {
        await db.contact.update({
          where: { id: contactId },
          data: { tags: [...contact.tags, tag] },
        });
      }
      break;
    }

    case "ASSIGN_OWNER": {
      if (!config.ownerId) break;
      const ownerId = String(config.ownerId);
      if (contactId) {
        await db.contact.update({ where: { id: contactId }, data: { ownerId } });
      }
      if (dealId) {
        await db.deal.update({ where: { id: dealId }, data: { ownerId } });
      }
      break;
    }

    default:
      // SEND_SMS, SEND_WHATSAPP, ENROLL_SEQUENCE, SEND_NOTIFICATION — log only
      console.log(`[automations] action type ${type} not yet implemented`);
  }
}

function interpolate(template: string, payload: AutomationPayload, contactName?: string): string {
  return template
    .replace(/\{\{firstName\}\}/g, String(payload.firstName ?? contactName?.split(" ")[0] ?? ""))
    .replace(/\{\{lastName\}\}/g, String(payload.lastName ?? contactName?.split(" ")[1] ?? ""))
    .replace(/\{\{fullName\}\}/g, String(payload.fullName ?? contactName ?? ""))
    .replace(/\{\{email\}\}/g, String(payload.email ?? ""))
    .replace(/\{\{dealTitle\}\}/g, String(payload.dealTitle ?? ""))
    .replace(/\{\{bookingRef\}\}/g, String(payload.bookingRef ?? ""));
}
