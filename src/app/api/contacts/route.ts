import { auth } from "@/auth";
import { getContactsCursor } from "@/lib/actions/contacts";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const source = url.searchParams.get("source") ?? undefined;
  const ownerId = url.searchParams.get("ownerId") ?? undefined;

  const result = await getContactsCursor({ cursor, limit, search, status, source, ownerId });
  return Response.json(result);
}
