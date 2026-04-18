import { Resend } from "resend";
import { db } from "@/lib/db";

// Lazy singleton — avoids "Missing API key" crash at module load time when key is not yet set
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "resend.dev";
const FROM_ADDRESS = APP_DOMAIN === "resend.dev"
  ? "onboarding@resend.dev"
  : `noreply@${APP_DOMAIN}`;

async function getCompanyName(): Promise<string> {
  try {
    const s = await db.companySettings.findUnique({ where: { id: "singleton" } });
    return s?.companyName ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Zeno Trip";
  } catch {
    return process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Zeno Trip";
  }
}

function baseLayout(content: string, previewText: string, companyName = "Zeno Trip"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; color: #111827; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #7c3aed 100%); padding: 40px 40px 32px; text-align: center; }
    .header-logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .header-logo-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.3); }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.3; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 6px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 8px; }
    .lead { font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 12px; }
    .details-table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; background: #f9fafb; border: 1px solid #e5e7eb; }
    .details-table tr:not(:last-child) td { border-bottom: 1px solid #e5e7eb; }
    .details-table td { padding: 12px 16px; font-size: 14px; }
    .details-table td:first-child { color: #6b7280; font-weight: 500; width: 40%; }
    .details-table td:last-child { color: #111827; font-weight: 600; }
    .cta-section { text-align: center; padding: 28px 0 8px; }
    .cta-button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.01em; }
    .portal-box { background: linear-gradient(135deg, #ede9fe, #f5f3ff); border: 1px solid #c4b5fd; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .portal-box h3 { font-size: 14px; font-weight: 700; color: #5b21b6; margin-bottom: 8px; }
    .portal-box p { font-size: 13px; color: #6d28d9; line-height: 1.5; }
    .portal-box .cred { background: #fff; border-radius: 8px; padding: 10px 14px; margin-top: 10px; font-size: 13px; border: 1px solid #ddd6fe; }
    .portal-box .cred span { color: #7c3aed; font-weight: 700; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .footer { padding: 24px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .footer a { color: #6d28d9; text-decoration: none; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
      <div class="footer">
        <p>
          ${companyName} &nbsp;·&nbsp; Your Premium Travel Partner<br />
          <a href="${APP_URL}">${APP_URL}</a>
        </p>
        <p style="margin-top:8px;">You received this email because you have a booking with ${companyName}.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Generic sendEmail ────────────────────────────────────────────────────────

export async function sendEmail(data: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.log(`[email] No API key — would send to ${data.to}: ${data.subject}`);
    return { success: true };
  }
  try {
    await resend.emails.send({
      from: data.from ?? FROM_ADDRESS,
      to: data.to,
      subject: data.subject,
      html: data.html,
      replyTo: data.replyTo,
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] sendEmail error:", msg);
    return { success: false, error: msg };
  }
}

// ─── Booking Confirmation ─────────────────────────────────────────────────────

export async function sendBookingConfirmation(data: {
  bookingRef: string;
  contactName: string;
  contactEmail: string;
  startDate: Date;
  endDate: Date;
  packageName: string | null;
  totalAmount: number;
  currency: string;
  paidAmount: number;
  bookingId: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY not set – skipping booking confirmation email");
    return;
  }

  const COMPANY_NAME = await getCompanyName();
  const portalUrl = `${APP_URL}/portal`;
  const bookingUrl = `${APP_URL}/portal/bookings/${data.bookingId}`;
  const balance = data.totalAmount - data.paidAmount;

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }).format(d);

  const html = baseLayout(`
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;">${COMPANY_NAME}</span>
      </div>
      <h1>Booking Confirmed!</h1>
      <p>Your travel adventure is officially booked.</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.contactName},</p>
      <p class="lead">
        Wonderful news — your booking has been confirmed. We're thrilled to be a part of your travel journey.
        Please keep this email for your records.
      </p>

      <p class="section-title">Booking Details</p>
      <table class="details-table">
        <tr><td>Booking Reference</td><td style="font-family:monospace;font-size:15px;letter-spacing:0.05em;">${data.bookingRef.slice(0, 8).toUpperCase()}</td></tr>
        ${data.packageName ? `<tr><td>Package</td><td>${data.packageName}</td></tr>` : ""}
        <tr><td>Travel Dates</td><td>${formatDate(data.startDate)} – ${formatDate(data.endDate)}</td></tr>
        <tr><td>Total Amount</td><td>${data.currency} ${data.totalAmount.toLocaleString()}</td></tr>
        <tr><td>Amount Paid</td><td style="color:#059669;">${data.currency} ${data.paidAmount.toLocaleString()}</td></tr>
        <tr><td>Balance Due</td><td style="color:${balance > 0 ? "#dc2626" : "#059669"};">${data.currency} ${balance.toLocaleString()}</td></tr>
      </table>

      <div class="portal-box">
        <h3>🔐 Access Your Booking Portal</h3>
        <p>You can view your booking details, itinerary, and documents anytime through your personal travel portal.</p>
        <div class="cred">
          <strong>Login at:</strong> <a href="${portalUrl}" style="color:#7c3aed;">${portalUrl}</a><br />
          <strong>Email:</strong> <span>${data.contactEmail}</span><br />
          <strong>Booking Ref:</strong> <span>${data.bookingRef.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <div class="cta-section">
        <a href="${bookingUrl}" class="cta-button">View Your Booking</a>
      </div>

      <hr class="divider" />
      <p style="font-size:13px;color:#6b7280;text-align:center;">
        Questions? Reply to this email or contact your travel agent directly.<br />
        We look forward to making your trip unforgettable.
      </p>
    </div>
  `, `Booking Confirmation – ${data.bookingRef.slice(0, 8).toUpperCase()}`, COMPANY_NAME);

  await getResend()!.emails.send({
    from: FROM_ADDRESS,
    to: data.contactEmail,
    subject: `Your Booking Confirmation – ${data.bookingRef.slice(0, 8).toUpperCase()}`,
    html,
  });
}

// ─── Passport Reminder ────────────────────────────────────────────────────────

export async function sendPassportReminder(data: {
  bookingRef: string;
  contactName: string;
  contactEmail: string;
  travelDate: Date;
  passengersWithoutPassport: string[];
}) {
  if (!process.env.RESEND_API_KEY) return;

  const COMPANY_NAME = await getCompanyName();
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }).format(d);

  const passengerList = data.passengersWithoutPassport.map((n) => `<li style="padding:4px 0;color:#374151;">${n}</li>`).join("");

  const html = baseLayout(`
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 2v4M8 2v4"/></svg>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;">${COMPANY_NAME}</span>
      </div>
      <h1>Passport Documents Required</h1>
      <p>Action needed before your departure.</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.contactName},</p>
      <p class="lead">
        Your trip is coming up on <strong>${formatDate(data.travelDate)}</strong> and we still need passport copies
        for the following travellers. Please submit them at your earliest convenience to avoid any delays.
      </p>
      <p class="section-title">Missing Passport Documents</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <ul style="list-style:none;padding:0;margin:0;">${passengerList}</ul>
      </div>
      <table class="details-table">
        <tr><td>Booking Reference</td><td style="font-family:monospace;">${data.bookingRef.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td>Travel Date</td><td>${formatDate(data.travelDate)}</td></tr>
      </table>
      <div class="cta-section">
        <a href="${APP_URL}/portal" class="cta-button">Submit Documents via Portal</a>
      </div>
      <hr class="divider" />
      <p style="font-size:13px;color:#6b7280;text-align:center;">
        Please ensure passports are valid for at least 6 months beyond your travel date.<br />
        Contact us immediately if you need assistance.
      </p>
    </div>
  `, `Action Required: Passport Documents for Booking ${data.bookingRef.slice(0, 8).toUpperCase()}`, COMPANY_NAME);

  await getResend()!.emails.send({
    from: FROM_ADDRESS,
    to: data.contactEmail,
    subject: `Action Required: Passport Documents – ${data.bookingRef.slice(0, 8).toUpperCase()}`,
    html,
  });
}

// ─── Visa Deadline Alert ──────────────────────────────────────────────────────

export async function sendVisaDeadlineAlert(data: {
  bookingRef: string;
  contactName: string;
  contactEmail: string;
  travelDate: Date;
  destinations: string[];
}) {
  if (!process.env.RESEND_API_KEY) return;

  const COMPANY_NAME = await getCompanyName();
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }).format(d);

  const daysLeft = Math.ceil((data.travelDate.getTime() - Date.now()) / 86400000);

  const html = baseLayout(`
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;">${COMPANY_NAME}</span>
      </div>
      <h1>Visa Application Reminder</h1>
      <p>${daysLeft} days until departure — visa deadlines approaching.</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.contactName},</p>
      <p class="lead">
        Your departure is in <strong>${daysLeft} days</strong> (${formatDate(data.travelDate)}).
        If you haven't already applied for your visa, please do so immediately as processing times can take 2–4 weeks.
      </p>
      <table class="details-table">
        <tr><td>Booking Reference</td><td style="font-family:monospace;">${data.bookingRef.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td>Travel Date</td><td>${formatDate(data.travelDate)}</td></tr>
        <tr><td>Destinations</td><td>${data.destinations.join(", ") || "As per booking"}</td></tr>
      </table>
      <div class="cta-section">
        <a href="${APP_URL}/portal" class="cta-button">View Booking Details</a>
      </div>
      <hr class="divider" />
      <p style="font-size:13px;color:#6b7280;text-align:center;">
        Our team can assist with visa applications. Reply to this email for help.
      </p>
    </div>
  `, `Visa Reminder – ${data.bookingRef.slice(0, 8).toUpperCase()}`, COMPANY_NAME);

  await getResend()!.emails.send({
    from: FROM_ADDRESS,
    to: data.contactEmail,
    subject: `Visa Reminder – ${data.bookingRef.slice(0, 8).toUpperCase()} – ${daysLeft} days to go`,
    html,
  });
}

// ─── Payment Followup ─────────────────────────────────────────────────────────

export async function sendPaymentFollowup(data: {
  bookingRef: string;
  contactName: string;
  contactEmail: string;
  balanceAmount: number;
  currency: string;
  travelDate: Date;
  bookingId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const COMPANY_NAME = await getCompanyName();
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }).format(d);

  const daysLeft = Math.ceil((data.travelDate.getTime() - Date.now()) / 86400000);
  const bookingUrl = `${APP_URL}/portal/bookings/${data.bookingId}`;

  const html = baseLayout(`
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;">${COMPANY_NAME}</span>
      </div>
      <h1>Payment Reminder</h1>
      <p>Balance due before your trip.</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.contactName},</p>
      <p class="lead">
        This is a friendly reminder that your booking has an outstanding balance.
        Please complete your payment before your departure on <strong>${formatDate(data.travelDate)}</strong>.
      </p>
      <table class="details-table">
        <tr><td>Booking Reference</td><td style="font-family:monospace;">${data.bookingRef.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td>Travel Date</td><td>${formatDate(data.travelDate)}</td></tr>
        <tr><td>Days Remaining</td><td style="color:#dc2626;font-weight:700;">${daysLeft} days</td></tr>
        <tr><td>Outstanding Balance</td><td style="color:#dc2626;font-size:16px;font-weight:700;">${data.currency} ${data.balanceAmount.toLocaleString()}</td></tr>
      </table>
      <div class="cta-section">
        <a href="${bookingUrl}" class="cta-button">Complete Payment</a>
      </div>
      <hr class="divider" />
      <p style="font-size:13px;color:#6b7280;text-align:center;">
        If you have already made a payment, please disregard this message.<br />
        For payment assistance, reply to this email or contact your travel agent.
      </p>
    </div>
  `, `Payment Reminder – ${data.bookingRef.slice(0, 8).toUpperCase()}`, COMPANY_NAME);

  await getResend()!.emails.send({
    from: FROM_ADDRESS,
    to: data.contactEmail,
    subject: `Payment Reminder – ${data.bookingRef.slice(0, 8).toUpperCase()} – ${data.currency} ${data.balanceAmount.toLocaleString()} due`,
    html,
  });
}

// ─── Itinerary Share ──────────────────────────────────────────────────────────

export async function sendItineraryShare(data: {
  contactName: string;
  contactEmail: string;
  itineraryTitle: string;
  shareUrl: string;
  agentName: string;
  days: number;
  totalCost: number;
  currency: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY not set – skipping itinerary share email");
    return;
  }

  const COMPANY_NAME = await getCompanyName();
  const html = baseLayout(`
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;">${COMPANY_NAME}</span>
      </div>
      <h1>Your Itinerary is Ready</h1>
      <p>A bespoke travel experience, crafted just for you.</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.contactName},</p>
      <p class="lead">
        Exciting news! <strong>${data.agentName}</strong> has curated a personalised travel itinerary especially for you.
        Review every detail and let us know if you'd like any changes — we want everything to be perfect.
      </p>

      <p class="section-title">Itinerary at a Glance</p>
      <table class="details-table">
        <tr><td>Itinerary</td><td>${data.itineraryTitle}</td></tr>
        <tr><td>Duration</td><td>${data.days} Day${data.days !== 1 ? "s" : ""}</td></tr>
        <tr><td>Total Investment</td><td style="color:#4f46e5;font-size:16px;">${data.currency} ${data.totalCost.toLocaleString()}</td></tr>
        <tr><td>Prepared by</td><td>${data.agentName}</td></tr>
      </table>

      <div class="cta-section">
        <a href="${data.shareUrl}" class="cta-button">✈ View Your Itinerary</a>
      </div>

      <div class="portal-box" style="margin-top:24px;">
        <h3>✅ Approve Your Itinerary</h3>
        <p>
          Once you've reviewed the itinerary, click the "Approve" button within the itinerary page
          to confirm you're happy with the details and ready to proceed with booking.
        </p>
      </div>

      <hr class="divider" />
      <p style="font-size:13px;color:#6b7280;text-align:center;">
        This itinerary was crafted exclusively for you by ${data.agentName} at ${COMPANY_NAME}.<br />
        Have feedback? Simply reply to this email — we'd love to hear from you.
      </p>
    </div>
  `, `Your Travel Itinerary is Ready – ${data.itineraryTitle}`, COMPANY_NAME);

  await getResend()!.emails.send({
    from: FROM_ADDRESS,
    to: data.contactEmail,
    subject: `Your Travel Itinerary is Ready – ${data.itineraryTitle}`,
    html,
  });
}

// ─── Booking Status Update ────────────────────────────────────────────────────

export async function sendBookingStatusUpdate(data: {
  bookingRef: string;
  contactName: string;
  contactEmail: string;
  status: string;
  startDate: Date;
  bookingId: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY not set – skipping booking status email");
    return;
  }

  const COMPANY_NAME = await getCompanyName();
  const bookingUrl = `${APP_URL}/portal/bookings/${data.bookingId}`;
  const statusLabel = data.status.replace(/_/g, " ");

  const statusBadgeClass =
    data.status === "CONFIRMED" ? "status-confirmed" :
    data.status === "CANCELLED" ? "status-cancelled" : "status-pending";

  const statusMessage =
    data.status === "CONFIRMED"
      ? "Great news — your booking has been confirmed! We can't wait to make your trip a wonderful experience."
      : data.status === "CANCELLED"
      ? "Your booking has been cancelled. If this was unexpected or you have questions, please contact us."
      : data.status === "COMPLETED"
      ? "We hope you had an amazing trip! Thank you for travelling with us."
      : `Your booking status has been updated to ${statusLabel}.`;

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }).format(d);

  const html = baseLayout(`
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;">${COMPANY_NAME}</span>
      </div>
      <h1>Booking Status Update</h1>
      <p>Your booking status has changed.</p>
    </div>
    <div class="body">
      <p class="greeting">Dear ${data.contactName},</p>
      <p class="lead">${statusMessage}</p>

      <p class="section-title">Booking Details</p>
      <table class="details-table">
        <tr><td>Booking Reference</td><td style="font-family:monospace;font-size:15px;letter-spacing:0.05em;">${data.bookingRef.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td>Travel Date</td><td>${formatDate(data.startDate)}</td></tr>
        <tr>
          <td>Current Status</td>
          <td><span class="status-badge ${statusBadgeClass}">${statusLabel}</span></td>
        </tr>
      </table>

      <div class="cta-section">
        <a href="${bookingUrl}" class="cta-button">View Booking Details</a>
      </div>

      <hr class="divider" />
      <p style="font-size:13px;color:#6b7280;text-align:center;">
        Need help? Contact your travel agent or reply to this email.
      </p>
    </div>
  `, `Booking ${data.bookingRef.slice(0, 8).toUpperCase()} – Status Updated to ${statusLabel}`, COMPANY_NAME);

  await getResend()!.emails.send({
    from: FROM_ADDRESS,
    to: data.contactEmail,
    subject: `Booking ${data.bookingRef.slice(0, 8).toUpperCase()} – Status Updated to ${statusLabel}`,
    html,
  });
}

// ─── Generic Campaign Email ───────────────────────────────────────────────────

export async function sendCampaignEmail(data: {
  to: string;
  subject: string;
  body: string;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  companyName: string;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  unsubscribeToken?: string;
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { success: false, error: "Email not configured" };

  // Replace template variables
  const firstName = data.contactFirstName ?? "";
  const lastName = data.contactLastName ?? "";
  const personalised = data.body
    .replace(/\{\{firstName\}\}/gi, firstName)
    .replace(/\{\{lastName\}\}/gi, lastName)
    .replace(/\{\{fullName\}\}/gi, `${firstName} ${lastName}`.trim())
    .replace(/\{\{companyName\}\}/gi, data.companyName);

  const html = baseLayout(`
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;">${data.companyName}</span>
      </div>
    </div>
    <div class="body">
      <div style="font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${personalised.replace(/\n/g, "<br/>")}</div>
      ${data.unsubscribeToken ? `<hr class="divider"/><p style="font-size:11px;color:#9ca3af;text-align:center;"><a href="${APP_URL}/unsubscribe?token=${data.unsubscribeToken}" style="color:#9ca3af;">Unsubscribe</a></p>` : ""}
    </div>
  `, data.subject, data.companyName);

  const fromAddress = data.fromEmail && data.fromName
    ? `${data.fromName} <${data.fromEmail}>`
    : data.fromEmail ?? FROM_ADDRESS;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.to,
      subject: data.subject,
      html,
      replyTo: data.replyTo ?? undefined,
    });
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}
