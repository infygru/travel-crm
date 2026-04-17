import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderToStream } from "@react-pdf/renderer";
import { ItineraryPDFDocument } from "@/lib/pdf/itinerary-pdf";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const itinerary = await db.itinerary.findUnique({
    where: { id },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
      createdBy: { select: { name: true } },
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          items: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!itinerary) return new Response("Not found", { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await renderToStream(React.createElement(ItineraryPDFDocument, { data: itinerary }) as any);

  const fileName = `itinerary-${itinerary.title.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
