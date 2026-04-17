import { db } from "@/lib/db";
import { sendPaymentFollowup } from "@/lib/email";
import { addDays } from "date-fns";
import { JobResult } from "./passport-reminders";

export async function runPaymentFollowups(): Promise<JobResult> {
  const result: JobResult = { processed: 0, errors: 0, details: [] };

  const now = new Date();

  // Bookings with outstanding balance departing within 30 days
  const bookings = await db.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING"] },
      paymentStatus: { in: ["UNPAID", "PARTIAL"] },
      startDate: { lte: addDays(now, 30), gte: now },
    },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  for (const booking of bookings) {
    try {
      if (!booking.contact?.email) continue;

      const balance = booking.totalAmount - booking.paidAmount;
      if (balance <= 0) continue;

      // Check if payment followup email was sent within last 7 days
      const recentEmail = await db.emailLog.findFirst({
        where: {
          contactId: booking.contactId ?? undefined,
          subject: { contains: "Payment Reminder" },
          sentAt: { gte: addDays(now, -7) },
        },
      });
      if (recentEmail) continue;

      await sendPaymentFollowup({
        bookingRef: booking.bookingRef,
        contactName: `${booking.contact.firstName} ${booking.contact.lastName}`,
        contactEmail: booking.contact.email,
        balanceAmount: balance,
        currency: booking.currency,
        travelDate: booking.startDate,
        bookingId: booking.id,
      });

      // Log the email
      if (booking.contactId) {
        await db.emailLog.create({
          data: {
            subject: `Payment Reminder – ${booking.bookingRef.slice(0, 8).toUpperCase()}`,
            body: `Payment followup for balance ${booking.currency} ${balance}`,
            from: "noreply@system",
            to: booking.contact.email,
            contactId: booking.contactId,
          },
        });
      }

      result.processed++;
      result.details.push(`Payment followup sent for booking ${booking.bookingRef.slice(0, 8).toUpperCase()} — balance ${booking.currency} ${balance.toLocaleString()}`);
    } catch (err) {
      result.errors++;
      result.details.push(`Error for booking ${booking.bookingRef.slice(0, 8).toUpperCase()}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return result;
}
