import { db } from "@/lib/db";
import { runPassportReminders } from "./passport-reminders";
import { runVisaAlerts, runVisaApplicationAlerts } from "./visa-alerts";
import { runPaymentFollowups } from "./payment-followups";
import { processSequenceEnrollments } from "./sequences";
import { processScheduledSocialPosts } from "./social-posts";

export { runPassportReminders, runVisaAlerts, runVisaApplicationAlerts, runPaymentFollowups, processSequenceEnrollments, processScheduledSocialPosts };

export type AllJobsResult = {
  passportReminders: Awaited<ReturnType<typeof runPassportReminders>>;
  visaAlerts: Awaited<ReturnType<typeof runVisaAlerts>>;
  visaAppAlerts: Awaited<ReturnType<typeof runVisaApplicationAlerts>>;
  paymentFollowups: Awaited<ReturnType<typeof runPaymentFollowups>>;
  sequenceEnrollments: Awaited<ReturnType<typeof processSequenceEnrollments>>;
  socialPosts: Awaited<ReturnType<typeof processScheduledSocialPosts>>;
  totalProcessed: number;
  totalErrors: number;
  ranAt: string;
};

export async function runAllJobs(): Promise<AllJobsResult> {
  const ranAt = new Date().toISOString();

  const [passportReminders, visaAlerts, visaAppAlerts, paymentFollowups, sequenceEnrollments, socialPostsResult] = await Promise.allSettled([
    runPassportReminders(),
    runVisaAlerts(),
    runVisaApplicationAlerts(),
    runPaymentFollowups(),
    processSequenceEnrollments(),
    processScheduledSocialPosts(),
  ]);

  const pr = passportReminders.status === "fulfilled" ? passportReminders.value : { processed: 0, errors: 1, details: [passportReminders.reason?.message ?? "Unknown error"] };
  const va = visaAlerts.status === "fulfilled" ? visaAlerts.value : { processed: 0, errors: 1, details: [visaAlerts.reason?.message ?? "Unknown error"] };
  const vaa = visaAppAlerts.status === "fulfilled" ? visaAppAlerts.value : { processed: 0, errors: 1, details: [visaAppAlerts.reason?.message ?? "Unknown error"] };
  const pf = paymentFollowups.status === "fulfilled" ? paymentFollowups.value : { processed: 0, errors: 1, details: [paymentFollowups.reason?.message ?? "Unknown error"] };
  const se = sequenceEnrollments.status === "fulfilled" ? sequenceEnrollments.value : { processed: 0, errors: 1, details: [sequenceEnrollments.reason?.message ?? "Unknown error"] };
  const sp = socialPostsResult.status === "fulfilled" ? socialPostsResult.value : { processed: 0, errors: 1, details: [socialPostsResult.reason?.message ?? "Unknown error"] };

  const totalProcessed = pr.processed + va.processed + vaa.processed + pf.processed + se.processed + sp.processed;
  const totalErrors = pr.errors + va.errors + vaa.errors + pf.errors + se.errors + sp.errors;

  await db.scheduledJobLog.create({
    data: {
      jobName: "all",
      processed: totalProcessed,
      errors: totalErrors,
      details: {
        passportReminders: pr,
        visaAlerts: va,
        visaAppAlerts: vaa,
        paymentFollowups: pf,
        sequenceEnrollments: se,
        socialPosts: sp,
      },
    },
  });

  return {
    passportReminders: pr,
    visaAlerts: va,
    visaAppAlerts: vaa,
    paymentFollowups: pf,
    sequenceEnrollments: se,
    socialPosts: sp,
    totalProcessed,
    totalErrors,
    ranAt,
  };
}
