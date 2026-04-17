import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderToStream } from "@react-pdf/renderer";
import { BookingInvoicePDFDocument } from "@/lib/pdf/booking-invoice-pdf";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true, phone: true, nationality: true } },
      package: { select: { name: true } },
      agent: { select: { name: true } },
      passengers: { orderBy: { type: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking) return new Response("Not found", { status: 404 });

  const company = await db.companySettings.findUnique({ where: { id: "singleton" } });

  const pdfData = {
    ...booking,
    costPrice: (booking as { costPrice?: number }).costPrice ?? 0,
    companyName: company?.companyName,
    companyAddress: company ? [company.address, company.city, company.state, company.pincode].filter(Boolean).join(", ") : null,
    companyPhone: company?.phone,
    companyEmail: company?.email,
    companyGstin: company?.gstin,
    invoicePrefix: company?.invoicePrefix ?? "INV",
    invoiceFooter: company?.invoiceFooter,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await renderToStream(React.createElement(BookingInvoicePDFDocument, { data: pdfData }) as any);

  const shortRef = booking.bookingRef.slice(0, 8).toUpperCase();
  const fileName = `invoice-${company?.invoicePrefix ?? "INV"}-${shortRef}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
