import { db } from "@/lib/db";
import { runPassportReminders } from "./passport-reminders";
import { runVisaAlerts } from "./visa-alerts";
import { runPaymentFollowups } from "./payment-followups";
import { processSequenceEnrollments } from "./sequences";
import { processScheduledSocialPosts } from "./social-posts";

export { runPassportReminders, runVisaAlerts, runPaymentFollowups, processSequenceEnrollments, processScheduledSocialPosts };

export type AllJobsResult = {
  passportReminders: Awaited<ReturnType<typeof runPassportReminders>>;
  visaAlerts: Awaited<ReturnType<typeof runVisaAlerts>>;
  paymentFollowups: Awaited<ReturnType<typeof runPaymentFollowups>>;
  sequenceEnrollments: Awaited<ReturnType<typeof processSequenceEnrollments>>;
  socialPosts: Awaited<ReturnType<typeof processScheduledSocialPosts>>;
  totalProcessed: number;
  totalErrors: number;
  ranAt: string;
};

export async function runAllJobs(): Promise<AllJobsResult> {
  const ranAt = new Date().toISOString();

  const [passportReminders, visaAlerts, paymentFollowups, sequenceEnrollments, socialPostsResult] = await Promise.allSettled([
    runPassportReminders(),
    runVisaAlerts(),
    runPaymentFollowups(),
    processSequenceEnrollments(),
    processScheduledSocialPosts(),
  ]);

  const pr = passportReminders.status === "fulfilled" ? passportReminders.value : { processed: 0, errors: 1, details: [passportReminders.reason?.message ?? "Unknown error"] };
  const va = visaAlerts.status === "fulfilled" ? visaAlerts.value : { processed: 0, errors: 1, details: [visaAlerts.reason?.message ?? "Unknown error"] };
  const pf = paymentFollowups.status === "fulfilled" ? paymentFollowups.value : { processed: 0, errors: 1, details: [paymentFollowups.reason?.message ?? "Unknown error"] };
  const se = sequenceEnrollments.status === "fulfilled" ? sequenceEnrollments.value : { processed: 0, errors: 1, details: [sequenceEnrollments.reason?.message ?? "Unknown error"] };
  const sp = socialPostsResult.status === "fulfilled" ? socialPostsResult.value : { processed: 0, errors: 1, details: [socialPostsResult.reason?.message ?? "Unknown error"] };

  const totalProcessed = pr.processed + va.processed + pf.processed + se.processed + sp.processed;
  const totalErrors = pr.errors + va.errors + pf.errors + se.errors + sp.errors;

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
        socialPosts: sp,
      },
    },
  });

  return {
    passportReminders: pr,
    visaAlerts: va,
    paymentFollowups: pf,
    sequenceEnrollments: se,
    socialPosts: sp,
    totalProcessed,
    totalErrors,
    ranAt,
  };
}
