import { auth } from "@/auth";
import { getBookingsCursor } from "@/lib/actions/bookings";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const paymentStatus = url.searchParams.get("paymentStatus") ?? undefined;
  const agentId = url.searchParams.get("agentId") ?? undefined;

  const result = await getBookingsCursor({ cursor, limit, search, status, paymentStatus, agentId });
  return Response.json(result);
}
