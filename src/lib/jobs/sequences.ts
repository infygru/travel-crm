import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type JobResult = { processed: number; errors: number; details: string[] };

export async function processSequenceEnrollments(): Promise<JobResult> {
  const processed: number[] = [];
  const errors: string[] = [];

  const now = new Date();

  // Fetch all ACTIVE enrollments that are due
  const enrollments = await db.sequenceEnrollment.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { nextSendAt: null },
        { nextSendAt: { lte: now } },
      ],
    },
    include: {
      sequence: {
        include: {
          steps: { orderBy: { order: "asc" } },
        },
      },
      contact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  for (const enrollment of enrollments) {
    try {
      const steps = enrollment.sequence.steps;

      if (steps.length === 0) {
        // No steps — complete immediately
        await db.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "COMPLETED", completedAt: now },
        });
        continue;
      }

      const stepIndex = enrollment.currentStep;

      if (stepIndex >= steps.length) {
        // All steps done
        await db.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "COMPLETED", completedAt: now },
        });
        continue;
      }

      const step = steps[stepIndex];

      // Send the step message
      if (step.channel === "EMAIL" && enrollment.contact.email && step.body) {
        const subject = step.subject ?? enrollment.sequence.name;
        const body = interpolate(step.body, enrollment.contact);
        const htmlBody = body.replace(/\n/g, "<br>");

        await sendEmail({
          to: enrollment.contact.email,
          subject: interpolate(subject, enrollment.contact),
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">${htmlBody}</div>`,
        });
      }
      // SMS/WhatsApp: not yet integrated — skip silently

      // Advance to next step
      const nextIndex = stepIndex + 1;
      const isLast = nextIndex >= steps.length;

      if (isLast) {
        await db.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextIndex,
            status: "COMPLETED",
            completedAt: now,
            nextSendAt: null,
          },
        });
      } else {
        const nextStep = steps[nextIndex];
        const delayMs = ((nextStep.delayDays ?? 0) * 86400 + (nextStep.delayHours ?? 0) * 3600) * 1000;
        const nextSendAt = new Date(now.getTime() + Math.max(delayMs, 0));

        await db.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextIndex,
            nextSendAt,
          },
        });
      }

      processed.push(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Enrollment ${enrollment.id}: ${msg}`);
    }
  }

  return {
    processed: processed.length,
    errors: errors.length,
    details: errors,
  };
}

function interpolate(
  template: string,
  contact: { firstName: string; lastName: string; email: string | null }
): string {
  return template
    .replace(/\{\{firstName\}\}/g, contact.firstName)
    .replace(/\{\{lastName\}\}/g, contact.lastName)
    .replace(/\{\{fullName\}\}/g, `${contact.firstName} ${contact.lastName}`)
    .replace(/\{\{email\}\}/g, contact.email ?? "");
}
