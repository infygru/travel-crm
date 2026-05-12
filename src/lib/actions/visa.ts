"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email";
import { getIntegrationConfig } from "@/lib/config";
import { VisaStage, VisaType, VisaDocStatus, Priority } from "@prisma/client";

// Default document checklist per visa type
const VISA_DOCUMENT_TEMPLATES: Record<string, string[]> = {
  SCHENGEN: [
    "Valid Passport (6+ months validity)",
    "Passport copies (first & last page)",
    "Biometric Photos (2 nos, 35x45mm)",
    "Travel Insurance (min €30,000 cover)",
    "Flight Itinerary / Confirmed Tickets",
    "Hotel Bookings / Accommodation Proof",
    "Bank Statement (last 3 months)",
    "Bank Solvency Certificate",
    "Salary Slips (last 3 months)",
    "Employment Letter / Business Proof",
    "Leave Approval Letter",
    "Income Tax Returns (last 2 years)",
    "Cover Letter",
    "Visa Application Form (signed)",
    "Travel History (previous visas)",
  ],
  UK: [
    "Valid Passport (6+ months validity)",
    "Passport copies",
    "Biometric Photos",
    "Bank Statement (last 6 months)",
    "Salary Slips (last 6 months)",
    "Employment Letter",
    "Travel Itinerary & Hotel Bookings",
    "Invitation Letter (if applicable)",
    "Income Tax Returns (last 2 years)",
    "Property Documents (if applicable)",
    "Visa Application Form",
    "IHS Payment Receipt",
  ],
  USA: [
    "Valid Passport",
    "DS-160 Confirmation Page",
    "Visa Fee Payment Receipt (MRV)",
    "Photo (51x51mm, white background)",
    "Interview Appointment Letter",
    "Bank Statement (last 6 months)",
    "Employment / Business Proof",
    "Salary Slips",
    "Income Tax Returns",
    "Property / Asset Documents",
    "Travel Itinerary",
    "Previous US Visa (if any)",
  ],
  DUBAI_UAE: [
    "Valid Passport (6+ months validity)",
    "Passport copies",
    "Biometric Photos",
    "Bank Statement (last 3 months)",
    "Employment Letter / Business Proof",
    "Salary Certificate",
    "Return Ticket",
    "Hotel Booking Confirmation",
  ],
  DEFAULT: [
    "Valid Passport (6+ months validity)",
    "Passport copies",
    "Photos (passport size)",
    "Bank Statement (last 3 months)",
    "Employment / Business Proof",
    "Travel Itinerary",
    "Hotel Bookings",
    "Visa Application Form",
  ],
};

export async function getVisaApplications(params?: {
  search?: string;
  stage?: string;
  visaType?: string;
  priority?: string;
  agentId?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 25;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params?.search) {
    where.OR = [
      { applicationRef: { contains: params.search, mode: "insensitive" } },
      { destinationCountry: { contains: params.search, mode: "insensitive" } },
      { embassyCenter: { contains: params.search, mode: "insensitive" } },
      { contact: { firstName: { contains: params.search, mode: "insensitive" } } },
      { contact: { lastName: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params?.stage) where.stage = params.stage;
  if (params?.visaType) where.visaType = params.visaType;
  if (params?.priority) where.priority = params.priority;
  if (params?.agentId) where.agentId = params.agentId;

  const [applications, total] = await Promise.all([
    db.visaApplication.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        booking: { select: { id: true, bookingRef: true } },
        agent: { select: { id: true, name: true } },
        documents: { select: { id: true, status: true } },
        _count: { select: { reminders: true } },
      },
      orderBy: [{ priority: "desc" }, { travelDate: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.visaApplication.count({ where }),
  ]);

  return { applications, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getVisaStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const [total, byStage, urgent, approved, rejected] = await Promise.all([
    db.visaApplication.count(),
    db.visaApplication.groupBy({ by: ["stage"], _count: { stage: true } }),
    db.visaApplication.count({
      where: {
        priority: "URGENT",
        stage: { notIn: ["APPROVED", "REJECTED", "CANCELLED"] },
      },
    }),
    db.visaApplication.count({ where: { stage: "APPROVED" } }),
    db.visaApplication.count({ where: { stage: "REJECTED" } }),
  ]);

  const stageMap: Record<string, number> = {};
  for (const s of byStage) stageMap[s.stage] = s._count.stage;

  return { total, byStage: stageMap, urgent, approved, rejected };
}

export async function getVisaApplicationById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.visaApplication.findUnique({
    where: { id },
    include: {
      contact: {
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          nationality: true, passportNumber: true, passportExpiry: true,
        },
      },
      booking: { select: { id: true, bookingRef: true, startDate: true, endDate: true, destinations: true } },
      agent: { select: { id: true, name: true, email: true } },
      documents: { orderBy: { createdAt: "asc" } },
      reminders: { orderBy: { sentAt: "desc" }, take: 20 },
    },
  });
}

export async function createVisaApplication(data: {
  contactId: string;
  bookingId?: string;
  agentId?: string;
  visaType: VisaType;
  destinationCountry: string;
  embassyCenter?: string;
  travelDate?: string;
  priority?: Priority;
  notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const docTemplate = VISA_DOCUMENT_TEMPLATES[data.visaType] ?? VISA_DOCUMENT_TEMPLATES.DEFAULT;

  const visa = await db.visaApplication.create({
    data: {
      contactId: data.contactId,
      bookingId: data.bookingId || null,
      agentId: data.agentId || (session.user as { id: string }).id || null,
      visaType: data.visaType,
      destinationCountry: data.destinationCountry,
      embassyCenter: data.embassyCenter || null,
      travelDate: data.travelDate ? new Date(data.travelDate) : null,
      priority: data.priority ?? "MEDIUM",
      notes: data.notes || null,
      stage: "INITIATED",
      documents: {
        create: docTemplate.map((name) => ({ name, status: "PENDING" as VisaDocStatus })),
      },
    },
  });

  revalidatePath("/visa");
  return visa;
}

export async function updateVisaStage(id: string, stage: VisaStage, extra?: {
  submittedAt?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  decisionDate?: string;
  rejectionReason?: string;
  trackingNumber?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = { stage };
  if (extra?.submittedAt) updateData.submittedAt = new Date(extra.submittedAt);
  if (extra?.appointmentDate) updateData.appointmentDate = new Date(extra.appointmentDate);
  if (extra?.appointmentTime) updateData.appointmentTime = extra.appointmentTime;
  if (extra?.decisionDate) updateData.decisionDate = new Date(extra.decisionDate);
  if (extra?.rejectionReason) updateData.rejectionReason = extra.rejectionReason;
  if (extra?.trackingNumber) updateData.trackingNumber = extra.trackingNumber;

  const visa = await db.visaApplication.update({
    where: { id },
    data: updateData,
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  revalidatePath("/visa");
  revalidatePath(`/visa/${id}`);
  return visa;
}

export async function updateVisaApplication(id: string, data: {
  embassyCenter?: string;
  travelDate?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  trackingNumber?: string;
  notes?: string;
  priority?: Priority;
  agentId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const visa = await db.visaApplication.update({
    where: { id },
    data: {
      embassyCenter: data.embassyCenter,
      travelDate: data.travelDate ? new Date(data.travelDate) : undefined,
      appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
      appointmentTime: data.appointmentTime,
      trackingNumber: data.trackingNumber,
      notes: data.notes,
      priority: data.priority,
      agentId: data.agentId,
    },
  });

  revalidatePath("/visa");
  revalidatePath(`/visa/${id}`);
  return visa;
}

export async function updateDocumentStatus(docId: string, status: VisaDocStatus, notes?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const doc = await db.visaDocument.update({
    where: { id: docId },
    data: {
      status,
      notes: notes ?? undefined,
      receivedAt: status === "RECEIVED" || status === "VERIFIED" ? new Date() : undefined,
    },
    include: { visa: { select: { id: true } } },
  });

  // Auto-advance stage: if all docs received/verified, move to DOCUMENTS_RECEIVED
  const visa = await db.visaApplication.findUnique({
    where: { id: doc.visa.id },
    include: { documents: true },
  });
  if (visa && visa.stage === "DOCUMENTS_PENDING") {
    const allReceived = visa.documents.every(
      (d) => d.status === "RECEIVED" || d.status === "VERIFIED"
    );
    if (allReceived) {
      await db.visaApplication.update({
        where: { id: visa.id },
        data: { stage: "DOCUMENTS_RECEIVED" },
      });
    }
  }

  revalidatePath(`/visa/${doc.visa.id}`);
  return doc;
}

export async function sendVisaReminder(id: string, type: "document" | "deadline" | "appointment" | "status") {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const visa = await db.visaApplication.findUnique({
    where: { id },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!visa || !visa.contact.email) throw new Error("Visa application or contact email not found");

  const cfg = await getIntegrationConfig();
  const companyName = cfg.emailFromName ?? "Zeno Trip";
  const appUrl = cfg.appUrl;

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(d);

  const visaTypeLabel: Record<string, string> = {
    SCHENGEN: "Schengen", UK: "UK", USA: "USA", CANADA: "Canada",
    AUSTRALIA: "Australia", DUBAI_UAE: "Dubai / UAE", SINGAPORE: "Singapore",
    JAPAN: "Japan", CHINA: "China", NEW_ZEALAND: "New Zealand", OTHER: "Visa",
  };

  const templates: Record<string, { subject: string; body: string }> = {
    document: {
      subject: `Action Required: Visa Documents Pending – ${visaTypeLabel[visa.visaType]} Visa`,
      body: `
        <p class="greeting">Dear ${visa.contact.firstName},</p>
        <p class="lead">
          We're processing your <strong>${visaTypeLabel[visa.visaType]} Visa</strong> application for
          <strong>${visa.destinationCountry}</strong>${visa.travelDate ? ` departing <strong>${formatDate(visa.travelDate)}</strong>` : ""}.
          Some documents are still pending. Please submit them at the earliest to avoid delays.
        </p>
        <table class="details-table">
          <tr><td>Visa Type</td><td>${visaTypeLabel[visa.visaType]}</td></tr>
          <tr><td>Destination</td><td>${visa.destinationCountry}</td></tr>
          ${visa.embassyCenter ? `<tr><td>Processing Center</td><td>${visa.embassyCenter}</td></tr>` : ""}
          ${visa.travelDate ? `<tr><td>Travel Date</td><td>${formatDate(visa.travelDate)}</td></tr>` : ""}
        </table>
        <div class="cta-section">
          <a href="${appUrl}/portal" class="cta-button">Submit Documents Now</a>
        </div>
      `,
    },
    deadline: {
      subject: `Urgent: Visa Application Deadline Approaching – ${visaTypeLabel[visa.visaType]} Visa`,
      body: `
        <p class="greeting">Dear ${visa.contact.firstName},</p>
        <p class="lead">
          Your <strong>${visaTypeLabel[visa.visaType]} Visa</strong> application deadline is approaching.
          ${visa.travelDate ? `Your travel date is <strong>${formatDate(visa.travelDate)}</strong> and visa processing typically takes 2–4 weeks.` : "Please expedite your application immediately."}
        </p>
        <table class="details-table">
          <tr><td>Visa Type</td><td>${visaTypeLabel[visa.visaType]}</td></tr>
          <tr><td>Destination</td><td>${visa.destinationCountry}</td></tr>
          <tr><td>Current Status</td><td>${visa.stage.replace(/_/g, " ")}</td></tr>
          ${visa.travelDate ? `<tr><td>Travel Date</td><td>${formatDate(visa.travelDate)}</td></tr>` : ""}
        </table>
        <div class="cta-section">
          <a href="${appUrl}/portal" class="cta-button">Check Application Status</a>
        </div>
      `,
    },
    appointment: {
      subject: `Visa Appointment Reminder – ${visaTypeLabel[visa.visaType]}${visa.appointmentDate ? ` on ${formatDate(visa.appointmentDate)}` : ""}`,
      body: `
        <p class="greeting">Dear ${visa.contact.firstName},</p>
        <p class="lead">
          This is a reminder about your upcoming visa appointment.
        </p>
        <table class="details-table">
          <tr><td>Visa Type</td><td>${visaTypeLabel[visa.visaType]}</td></tr>
          <tr><td>Destination</td><td>${visa.destinationCountry}</td></tr>
          ${visa.embassyCenter ? `<tr><td>Appointment Center</td><td>${visa.embassyCenter}</td></tr>` : ""}
          ${visa.appointmentDate ? `<tr><td>Appointment Date</td><td>${formatDate(visa.appointmentDate)}</td></tr>` : ""}
          ${visa.appointmentTime ? `<tr><td>Appointment Time</td><td>${visa.appointmentTime}</td></tr>` : ""}
        </table>
        <p style="font-size:14px;color:#374151;margin-top:16px;">
          <strong>Important:</strong> Please carry all original documents along with copies to your appointment.
          Arrive at least 30 minutes early.
        </p>
        <div class="cta-section">
          <a href="${appUrl}/portal" class="cta-button">View Application Details</a>
        </div>
      `,
    },
    status: {
      subject: `Visa Application Update – ${visaTypeLabel[visa.visaType]} – ${visa.stage.replace(/_/g, " ")}`,
      body: `
        <p class="greeting">Dear ${visa.contact.firstName},</p>
        <p class="lead">
          Your <strong>${visaTypeLabel[visa.visaType]} Visa</strong> application status has been updated.
        </p>
        <table class="details-table">
          <tr><td>Visa Type</td><td>${visaTypeLabel[visa.visaType]}</td></tr>
          <tr><td>Destination</td><td>${visa.destinationCountry}</td></tr>
          <tr><td>Current Status</td><td><strong>${visa.stage.replace(/_/g, " ")}</strong></td></tr>
          ${visa.travelDate ? `<tr><td>Travel Date</td><td>${formatDate(visa.travelDate)}</td></tr>` : ""}
        </table>
        <div class="cta-section">
          <a href="${appUrl}/portal" class="cta-button">View Application</a>
        </div>
      `,
    },
  };

  const tmpl = templates[type];

  // Use inline HTML wrapper compatible with sendEmail
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; color: #111827; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.07); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #7c3aed 100%); padding: 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,.8); font-size: 14px; margin-top: 6px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .lead { font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
    .details-table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; background: #f9fafb; border: 1px solid #e5e7eb; margin-bottom: 24px; }
    .details-table tr:not(:last-child) td { border-bottom: 1px solid #e5e7eb; }
    .details-table td { padding: 12px 16px; font-size: 14px; }
    .details-table td:first-child { color: #6b7280; font-weight: 500; width: 40%; }
    .details-table td:last-child { color: #111827; font-weight: 600; }
    .cta-section { text-align: center; padding: 20px 0; }
    .cta-button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; }
    .footer { padding: 24px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>${companyName}</h1>
        <p>Visa Application Update</p>
      </div>
      <div class="body">${tmpl.body}</div>
      <div class="footer">${companyName} &nbsp;·&nbsp; Your Premium Travel Partner</div>
    </div>
  </div>
</body>
</html>`;

  await sendEmail({ to: visa.contact.email, subject: tmpl.subject, html });

  await db.visaReminder.create({
    data: { visaId: id, type, channel: "email" },
  });
  await db.visaApplication.update({
    where: { id },
    data: { lastReminderAt: new Date(), alertSentCount: { increment: 1 } },
  });

  revalidatePath(`/visa/${id}`);
  return { success: true };
}

export async function deleteVisaApplication(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.visaApplication.delete({ where: { id } });
  revalidatePath("/visa");
}

export async function getAgentsForVisa() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
