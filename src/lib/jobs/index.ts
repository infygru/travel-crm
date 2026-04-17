import { db } from "@/lib/db";
import { runPassportReminders } from "./passport-reminders";
import { runVisaAlerts } from "./visa-alerts";
import { runPaymentFollowups } from "./payment-followups";
import { processSequenceEnrollments } from "./sequences";

export { runPassportReminders, runVisaAlerts, runPaymentFollowups, processSequenceEnrollments };

export type AllJobsResult = {
  passportReminders: Awaited<ReturnType<typeof runPassportReminders>>;
  visaAlerts: Awaited<ReturnType<typeof runVisaAlerts>>;
  paymentFollowups: Awaited<ReturnType<typeof runPaymentFollowups>>;
  sequenceEnrollments: Awaited<ReturnType<typeof processSequenceEnrollments>>;
  totalProcessed: number;
  totalErrors: number;
  ranAt: string;
};

export async function runAllJobs(): Promise<AllJobsResult> {
  const ranAt = new Date().toISOString();

  const [passportReminders, visaAlerts, paymentFollowups, sequenceEnrollments] = await Promise.allSettled([
    runPassportReminders(),
    runVisaAlerts(),
    runPaymentFollowups(),
    processSequenceEnrollments(),
  ]);

  const pr = passportReminders.status === "fulfilled" ? passportReminders.value : { processed: 0, errors: 1, details: [passportReminders.reason?.message ?? "Unknown error"] };
  const va = visaAlerts.status === "fulfilled" ? visaAlerts.value : { processed: 0, errors: 1, details: [visaAlerts.reason?.message ?? "Unknown error"] };
  const pf = paymentFollowups.status === "fulfilled" ? paymentFollowups.value : { processed: 0, errors: 1, details: [paymentFollowups.reason?.message ?? "Unknown error"] };
  const se = sequenceEnrollments.status === "fulfilled" ? sequenceEnrollments.value : { processed: 0, errors: 1, details: [sequenceEnrollments.reason?.message ?? "Unknown error"] };

  const totalProcessed = pr.processed + va.processed + pf.processed + se.processed;
  const totalErrors = pr.errors + va.errors + pf.errors + se.errors;

  // Log to DB
  await db.scheduledJobLog.create({
    data: {
      jobName: "all",
      processed: totalProcessed,
      errors: totalErrors,
      details: {
        passportReminders: pr,
        visaAlerts: va,
        paymentFollowups: pf,
        sequenceEnrollments: se,
      },
    },
  });

  return {
    passportReminders: pr,
    visaAlerts: va,
    paymentFollowups: pf,
    sequenceEnrollments: se,
    totalProcessed,
    totalErrors,
    ranAt,
  };
}
