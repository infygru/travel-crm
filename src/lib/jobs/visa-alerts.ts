import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendVisaDeadlineAlert } from "@/lib/email";
import { addDays, differenceInDays } from "date-fns";
import { JobResult } from "./passport-reminders";
import { getIntegrationConfig } from "@/lib/config";

// ─── Job 1: Booking-based visa deadline alerts (existing behaviour) ───────────

export async function runVisaAlerts(): Promise<JobResult> {
  const result: JobResult = { processed: 0, errors: 0, details: [] };

  const now = new Date();
  const windowStart = addDays(now, 40);
  const windowEnd = addDays(now, 50);

  const bookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { gte: windowStart, lte: windowEnd },
    },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  for (const booking of bookings) {
    try {
      if (!booking.contact?.email) continue;

      const recentTask = await db.task.findFirst({
        where: {
          bookingId: booking.id,
          title: { contains: "visa" },
          createdAt: { gte: addDays(now, -7) },
        },
      });
      if (recentTask) continue;

      await sendVisaDeadlineAlert({
        bookingRef: booking.bookingRef,
        contactName: `${booking.contact.firstName} ${booking.contact.lastName}`,
        contactEmail: booking.contact.email,
        travelDate: booking.startDate,
        destinations: booking.destinations,
      });

      result.processed++;
      result.details.push(`Visa alert sent for booking ${booking.bookingRef.slice(0, 8).toUpperCase()}`);
    } catch (err) {
      result.errors++;
      result.details.push(`Error for booking ${booking.bookingRef.slice(0, 8).toUpperCase()}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return result;
}

// ─── Job 2: VisaApplication-based smart alerts ───────────────────────────────

export async function runVisaApplicationAlerts(): Promise<JobResult> {
  const result: JobResult = { processed: 0, errors: 0, details: [] };

  const now = new Date();

  let cfg: Awaited<ReturnType<typeof getIntegrationConfig>>;
  try {
    cfg = await getIntegrationConfig();
  } catch {
    result.errors++;
    result.details.push("Failed to load integration config");
    return result;
  }

  const companyName = cfg.emailFromName ?? "Zeno Trip";
  const appUrl = cfg.appUrl;

  // 1. Documents pending — remind if no reminder in last 3 days
  const docsPending = await db.visaApplication.findMany({
    where: {
      stage: "DOCUMENTS_PENDING",
      OR: [
        { lastReminderAt: null },
        { lastReminderAt: { lte: addDays(now, -3) } },
      ],
    },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
      documents: { where: { status: "PENDING" }, select: { name: true } },
    },
  });

  for (const visa of docsPending) {
    try {
      if (!visa.contact.email) continue;
      if (visa.documents.length === 0) continue;

      const pendingList = visa.documents.slice(0, 5).map((d) => `<li>${d.name}</li>`).join("");
      const more = visa.documents.length > 5 ? `<li>... and ${visa.documents.length - 5} more</li>` : "";

      await sendEmail({
        to: visa.contact.email,
        subject: `Action Required: Visa Documents Pending`,
        html: buildSimpleEmail(companyName, appUrl, {
          heading: "Visa Documents Required",
          preview: "Some documents are pending for your visa application.",
          body: `
            <p style="font-size:15px;color:#374151;margin-bottom:16px;">
              Dear ${visa.contact.firstName}, the following documents are still pending for your
              <strong>${visa.visaType.replace(/_/g, " ")}</strong> visa to <strong>${visa.destinationCountry}</strong>.
              Please submit them at the earliest to avoid delays.
            </p>
            <ul style="font-size:14px;color:#374151;line-height:2;padding-left:16px;">${pendingList}${more}</ul>
          `,
          ctaText: "Submit Documents",
          ctaUrl: `${appUrl}/portal`,
        }),
      });

      await db.visaReminder.create({ data: { visaId: visa.id, type: "document_reminder", channel: "email" } });
      await db.visaApplication.update({
        where: { id: visa.id },
        data: { lastReminderAt: now, alertSentCount: { increment: 1 } },
      });

      result.processed++;
      result.details.push(`Docs reminder: ${visa.contact.firstName} ${visa.contact.lastName} (${visa.visaType})`);
    } catch (err) {
      result.errors++;
      result.details.push(`Error (docs): ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  // 2. Deadline alert — travel date within 30 days & not yet submitted
  const deadlineRisk = await db.visaApplication.findMany({
    where: {
      stage: { in: ["INITIATED", "DOCUMENTS_PENDING", "DOCUMENTS_RECEIVED"] },
      travelDate: { gte: now, lte: addDays(now, 30) },
      OR: [
        { lastReminderAt: null },
        { lastReminderAt: { lte: addDays(now, -5) } },
      ],
    },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  for (const visa of deadlineRisk) {
    try {
      if (!visa.contact.email || !visa.travelDate) continue;
      const days = differenceInDays(visa.travelDate, now);

      await sendEmail({
        to: visa.contact.email,
        subject: `Urgent: Visa Application Deadline – ${days} days to departure`,
        html: buildSimpleEmail(companyName, appUrl, {
          heading: "Visa Deadline Alert",
          preview: `Your travel date is ${days} days away — expedite your application.`,
          body: `
            <p style="font-size:15px;color:#374151;margin-bottom:16px;">
              Dear ${visa.contact.firstName}, your departure is in <strong>${days} days</strong> and
              your <strong>${visa.visaType.replace(/_/g, " ")} visa</strong> application hasn't been submitted yet.
              Schengen and most European visas require 2–4 weeks processing. Please act immediately.
            </p>
          `,
          ctaText: "Check Application Status",
          ctaUrl: `${appUrl}/portal`,
          urgent: true,
        }),
      });

      await db.visaReminder.create({ data: { visaId: visa.id, type: "deadline_alert", channel: "email" } });
      await db.visaApplication.update({
        where: { id: visa.id },
        data: { lastReminderAt: now, alertSentCount: { increment: 1 } },
      });

      result.processed++;
      result.details.push(`Deadline alert: ${visa.contact.firstName} ${visa.contact.lastName} — ${days}d left`);
    } catch (err) {
      result.errors++;
      result.details.push(`Error (deadline): ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  // 3. Appointment reminder — appointment within 2 days
  const appointmentSoon = await db.visaApplication.findMany({
    where: {
      stage: "APPOINTMENT_BOOKED",
      appointmentDate: { gte: now, lte: addDays(now, 2) },
      OR: [
        { lastReminderAt: null },
        { lastReminderAt: { lte: addDays(now, -1) } },
      ],
    },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  for (const visa of appointmentSoon) {
    try {
      if (!visa.contact.email || !visa.appointmentDate) continue;
      const days = differenceInDays(visa.appointmentDate, now);
      const when = days === 0 ? "TODAY" : days === 1 ? "tomorrow" : `in ${days} days`;

      await sendEmail({
        to: visa.contact.email,
        subject: `Visa Appointment Reminder – ${when}`,
        html: buildSimpleEmail(companyName, appUrl, {
          heading: "Appointment Reminder",
          preview: `Your visa appointment is ${when}.`,
          body: `
            <p style="font-size:15px;color:#374151;margin-bottom:16px;">
              Dear ${visa.contact.firstName}, this is a reminder that your <strong>${visa.visaType.replace(/_/g, " ")} visa</strong>
              appointment is <strong>${when}</strong>${visa.appointmentTime ? ` at ${visa.appointmentTime}` : ""}.
              ${visa.embassyCenter ? `Location: <strong>${visa.embassyCenter}</strong>.` : ""}
            </p>
            <p style="font-size:14px;color:#6b7280;">
              Please carry all original documents + copies. Arrive 30 minutes early.
            </p>
          `,
          ctaText: "View Checklist",
          ctaUrl: `${appUrl}/portal`,
          urgent: days === 0,
        }),
      });

      await db.visaReminder.create({ data: { visaId: visa.id, type: "appointment_reminder", channel: "email" } });
      await db.visaApplication.update({
        where: { id: visa.id },
        data: { lastReminderAt: now, alertSentCount: { increment: 1 } },
      });

      result.processed++;
      result.details.push(`Appointment reminder: ${visa.contact.firstName} ${visa.contact.lastName} — ${when}`);
    } catch (err) {
      result.errors++;
      result.details.push(`Error (appointment): ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  return result;
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildSimpleEmail(
  companyName: string,
  appUrl: string,
  opts: {
    heading: string;
    preview: string;
    body: string;
    ctaText: string;
    ctaUrl: string;
    urgent?: boolean;
  }
): string {
  const headerBg = opts.urgent
    ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
    : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;color:#111827}
    .w{max-width:600px;margin:0 auto;padding:24px 16px}
    .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)}
    .hdr{background:${headerBg};padding:36px 40px;text-align:center}
    .hdr h1{color:#fff;font-size:22px;font-weight:700}
    .hdr p{color:rgba(255,255,255,.8);font-size:13px;margin-top:6px}
    .body{padding:32px 40px}
    .cta{text-align:center;padding:20px 0}
    .btn{display:inline-block;padding:13px 32px;background:${headerBg};color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px}
    .footer{padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af}
  </style>
</head>
<body>
  <div class="w">
    <div class="card">
      <div class="hdr">
        <h1>${opts.heading}</h1>
        <p>${opts.preview}</p>
      </div>
      <div class="body">
        ${opts.body}
        <div class="cta">
          <a href="${opts.ctaUrl}" class="btn">${opts.ctaText}</a>
        </div>
      </div>
      <div class="footer">${companyName} &nbsp;·&nbsp; Your Premium Travel Partner &nbsp;·&nbsp; <a href="${appUrl}" style="color:#6d28d9">${appUrl}</a></div>
    </div>
  </div>
</body>
</html>`;
}
