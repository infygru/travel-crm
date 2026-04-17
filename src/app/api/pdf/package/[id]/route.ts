import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderToStream } from "@react-pdf/renderer";
import { PackagePDFDocument } from "@/lib/pdf/package-pdf";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const pkg = await db.travelPackage.findUnique({
    where: { id },
    include: { itinerary: { orderBy: { day: "asc" } } },
  });

  if (!pkg) return new Response("Not found", { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await renderToStream(React.createElement(PackagePDFDocument, { data: pkg }) as any);

  const fileName = `package-${pkg.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
