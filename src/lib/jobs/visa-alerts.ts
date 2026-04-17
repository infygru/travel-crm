import { db } from "@/lib/db";
import { sendVisaDeadlineAlert } from "@/lib/email";
import { addDays } from "date-fns";
import { JobResult } from "./passport-reminders";

export async function runVisaAlerts(): Promise<JobResult> {
  const result: JobResult = { processed: 0, errors: 0, details: [] };

  // Target bookings departing 40–50 days from now (window for 45-day reminder)
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

      // Check if visa reminder task was already sent recently
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
