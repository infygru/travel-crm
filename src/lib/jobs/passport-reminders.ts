import { db } from "@/lib/db";
import { sendPassportReminder } from "@/lib/email";
import { addDays } from "date-fns";

export type JobResult = {
  processed: number;
  errors: number;
  details: string[];
};

export async function runPassportReminders(): Promise<JobResult> {
  const result: JobResult = { processed: 0, errors: 0, details: [] };

  // Target bookings departing 55–65 days from now (window for 60-day reminder)
  const now = new Date();
  const windowStart = addDays(now, 55);
  const windowEnd = addDays(now, 65);

  const bookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { gte: windowStart, lte: windowEnd },
    },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
      passengers: { select: { firstName: true, lastName: true, passportNumber: true } },
    },
  });

  for (const booking of bookings) {
    try {
      if (!booking.contact?.email) continue;

      const missingPassport = booking.passengers.filter((p) => !p.passportNumber);
      if (missingPassport.length === 0) continue;

      // Check if reminder was already sent recently (within 7 days)
      const recentTask = await db.task.findFirst({
        where: {
          bookingId: booking.id,
          title: { contains: "passport copies" },
          createdAt: { gte: addDays(now, -7) },
        },
      });
      if (recentTask) continue;

      const passengerNames = missingPassport.map((p) => `${p.firstName} ${p.lastName}`);

      await sendPassportReminder({
        bookingRef: booking.bookingRef,
        contactName: `${booking.contact.firstName} ${booking.contact.lastName}`,
        contactEmail: booking.contact.email,
        travelDate: booking.startDate,
        passengersWithoutPassport: passengerNames,
      });

      result.processed++;
      result.details.push(`Passport reminder sent for booking ${booking.bookingRef.slice(0, 8).toUpperCase()}`);
    } catch (err) {
      result.errors++;
      result.details.push(`Error processing booking ${booking.bookingRef.slice(0, 8).toUpperCase()}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return result;
}
