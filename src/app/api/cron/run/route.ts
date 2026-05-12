import { runAllJobs } from "@/lib/jobs";

// Protected cron endpoint — hit daily by Vercel Cron or any external scheduler
// Set CRON_SECRET in environment variables and pass as x-cron-secret header
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET is always required — fail-closed to prevent unauthorized job triggering
  if (!cronSecret) {
    console.error("[cron] CRON_SECRET env var is not set — refusing to run jobs for security");
    return Response.json({ error: "Cron not configured. Set CRON_SECRET environment variable." }, { status: 503 });
  }

  const provided = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (provided !== cronSecret) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runAllJobs();
    return Response.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[cron] runAllJobs failed:", err);
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Allow Vercel cron to call this
export const dynamic = "force-dynamic";
