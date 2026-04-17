import { auth } from "@/auth";
import { db } from "@/lib/db";

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
      passengers: { orderBy: { type: "asc" } },
      contact: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!booking) return new Response("Not found", { status: 404 });

  const shortRef = booking.bookingRef.slice(0, 8).toUpperCase();

  const headers = [
    "First Name",
    "Last Name",
    "Type",
    "Date of Birth",
    "Gender",
    "Nationality",
    "Passport Number",
    "Passport Expiry",
    "Issuing Country",
    "Seat Preference",
    "Meal Preference",
    "Special Needs",
    "Email",
    "Phone",
    "Individual Cost",
  ];

  function escapeCSV(val: string | null | undefined): string {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function fmtDate(d: Date | null | undefined): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB");
  }

  const rows = booking.passengers.map((p) => [
    p.firstName,
    p.lastName,
    p.type,
    fmtDate(p.dateOfBirth),
    p.gender ?? "",
    p.nationality ?? "",
    p.passportNumber ?? "",
    fmtDate(p.passportExpiry),
    p.issuingCountry ?? "",
    p.seatPreference ?? "",
    p.mealPreference ?? "",
    p.specialNeeds ?? "",
    p.email ?? "",
    p.phone ?? "",
    (p as { individualCost?: number }).individualCost?.toString() ?? "0",
  ]);

  const csv = [
    `# Passenger Manifest — Booking ${shortRef}`,
    `# ${booking.contact?.firstName ?? ""} ${booking.contact?.lastName ?? ""} | ${new Date(booking.startDate).toLocaleDateString("en-GB")} – ${new Date(booking.endDate).toLocaleDateString("en-GB")}`,
    "",
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="manifest-${shortRef}.csv"`,
    },
  });
}
