import { runAllJobs } from "@/lib/jobs";

// Protected cron endpoint — hit daily by Vercel Cron or any external scheduler
// Set CRON_SECRET in environment variables and pass as x-cron-secret header
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, require it
  if (cronSecret) {
    const provided = request.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
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
