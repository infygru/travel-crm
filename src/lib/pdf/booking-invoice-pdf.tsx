import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const colors = {
  primary: "#4f46e5",
  primaryDark: "#3730a3",
  text: "#111827",
  muted: "#6b7280",
  light: "#f9fafb",
  border: "#e5e7eb",
  green: "#059669",
  red: "#dc2626",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: colors.text, backgroundColor: "#ffffff", padding: "36 40" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: colors.primary },
  invoiceLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.muted, textAlign: "right" },
  invoiceRef: { fontSize: 16, fontFamily: "Helvetica-Bold", color: colors.text, textAlign: "right", marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border, marginVertical: 16 },
  label: { fontSize: 8, color: colors.muted, marginBottom: 2 },
  value: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 },
  tableHeader: { flexDirection: "row", backgroundColor: colors.primary, padding: "6 8", borderRadius: 4, marginBottom: 2 },
  thCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  tableRow: { flexDirection: "row", padding: "6 8", borderBottomWidth: 1, borderBottomColor: colors.border },
  tableRowAlt: { flexDirection: "row", padding: "6 8", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.light },
  tdCell: { fontSize: 9, color: colors.text },
  totalRow: { flexDirection: "row", padding: "8 8", backgroundColor: "#ede9fe", borderRadius: 4, marginTop: 4 },
  totalLabel: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.primaryDark },
  totalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: colors.primary },
  paymentRow: { flexDirection: "row", padding: "6 8", borderBottomWidth: 1, borderBottomColor: colors.border },
  statusBadge: { fontSize: 7, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: colors.muted },
});

export type BookingInvoicePDFData = {
  companyName?: string;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyGstin?: string | null;
  invoicePrefix?: string;
  invoiceFooter?: string | null;
  bookingRef: string;
  status: string;
  paymentStatus: string;
  startDate: Date | string;
  endDate: Date | string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  costPrice: number;
  adults: number;
  children: number;
  infants: number;
  destinations: string[];
  specialRequests?: string | null;
  contact?: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    nationality?: string | null;
  } | null;
  package?: { name: string } | null;
  agent?: { name?: string | null } | null;
  passengers: Array<{
    firstName: string;
    lastName: string;
    type: string;
    nationality?: string | null;
    passportNumber?: string | null;
    passportExpiry?: Date | string | null;
    seatPreference?: string | null;
    mealPreference?: string | null;
    individualCost: number;
  }>;
  payments: Array<{
    amount: number;
    method: string;
    reference?: string | null;
    paidAt?: Date | string | null;
    status: string;
  }>;
};

// Company name passed in via data to avoid server-only imports in PDF renderer

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BookingInvoicePDFDocument({ data }: { data: BookingInvoicePDFData }) {
  const companyName = data.companyName ?? "Travel CRM";
  const shortRef = data.bookingRef.slice(0, 8).toUpperCase();
  const invoiceRef = `${data.invoicePrefix ?? "INV"}-${shortRef}`;
  const balance = data.totalAmount - data.paidAmount;
  const passengerTotal = data.passengers.reduce((s, p) => s + p.individualCost, 0);

  return (
    <Document title={`Invoice ${invoiceRef}`} author={companyName}>
      <Page size="A4" style={s.page}>
        {/* Top row */}
        <View style={s.row}>
          <View>
            <Text style={s.companyName}>{companyName}</Text>
            {data.companyAddress && <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>{data.companyAddress}</Text>}
            {data.companyPhone && <Text style={{ fontSize: 8, color: colors.muted }}>{data.companyPhone}</Text>}
            {data.companyGstin && <Text style={{ fontSize: 8, color: colors.muted }}>GSTIN: {data.companyGstin}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceLabel}>BOOKING INVOICE</Text>
            <Text style={s.invoiceRef}>{invoiceRef}</Text>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 4 }}>Issued: {fmt(new Date())}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Bill to / Trip details */}
        <View style={{ ...s.row, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>BILLED TO</Text>
            {data.contact ? (
              <>
                <Text style={s.value}>{data.contact.firstName} {data.contact.lastName}</Text>
                {data.contact.email && <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>{data.contact.email}</Text>}
                {data.contact.phone && <Text style={{ fontSize: 8, color: colors.muted }}>{data.contact.phone}</Text>}
                {data.contact.nationality && <Text style={{ fontSize: 8, color: colors.muted }}>{data.contact.nationality}</Text>}
              </>
            ) : (
              <Text style={s.value}>—</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>TRIP DETAILS</Text>
            <Text style={s.value}>{data.package?.name ?? "Custom Package"}</Text>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>
              {fmt(data.startDate)} – {fmt(data.endDate)}
            </Text>
            {data.destinations.length > 0 && (
              <Text style={{ fontSize: 8, color: colors.muted }}>{data.destinations.join(" · ")}</Text>
            )}
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>
              {data.adults}A{data.children > 0 ? ` · ${data.children}C` : ""}{data.infants > 0 ? ` · ${data.infants}I` : ""}
              {data.agent?.name ? `  ·  Agent: ${data.agent.name}` : ""}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.label}>STATUS</Text>
            <Text style={{ ...s.statusBadge, backgroundColor: data.status === "CONFIRMED" ? "#d1fae5" : "#fef3c7", color: data.status === "CONFIRMED" ? "#065f46" : "#92400e" }}>
              {data.status}
            </Text>
            <Text style={{ ...s.label, marginTop: 8 }}>PAYMENT</Text>
            <Text style={{ ...s.statusBadge, backgroundColor: data.paymentStatus === "PAID" ? "#d1fae5" : data.paymentStatus === "PARTIAL" ? "#fef3c7" : "#fee2e2", color: data.paymentStatus === "PAID" ? "#065f46" : data.paymentStatus === "PARTIAL" ? "#92400e" : "#991b1b" }}>
              {data.paymentStatus}
            </Text>
          </View>
        </View>

        {/* Passenger Manifest */}
        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>Passenger Manifest</Text>
          <View style={s.tableHeader}>
            <Text style={{ ...s.thCell, flex: 2 }}>Name</Text>
            <Text style={{ ...s.thCell, flex: 1 }}>Type</Text>
            <Text style={{ ...s.thCell, flex: 1 }}>Nationality</Text>
            <Text style={{ ...s.thCell, flex: 1.5 }}>Passport</Text>
            <Text style={{ ...s.thCell, flex: 1 }}>Expires</Text>
            <Text style={{ ...s.thCell, flex: 1 }}>Seat/Meal</Text>
            <Text style={{ ...s.thCell, flex: 1, textAlign: "right" }}>Cost</Text>
          </View>
          {data.passengers.map((p, i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={{ ...s.tdCell, flex: 2, fontFamily: "Helvetica-Bold" }}>{p.firstName} {p.lastName}</Text>
              <Text style={{ ...s.tdCell, flex: 1 }}>{p.type}</Text>
              <Text style={{ ...s.tdCell, flex: 1 }}>{p.nationality ?? "—"}</Text>
              <Text style={{ ...s.tdCell, flex: 1.5 }}>{p.passportNumber ?? "—"}</Text>
              <Text style={{ ...s.tdCell, flex: 1 }}>{p.passportExpiry ? fmt(p.passportExpiry) : "—"}</Text>
              <Text style={{ ...s.tdCell, flex: 1 }}>
                {[p.seatPreference, p.mealPreference].filter(Boolean).join("/") || "—"}
              </Text>
              <Text style={{ ...s.tdCell, flex: 1, textAlign: "right", color: p.individualCost > 0 ? colors.primary : colors.muted }}>
                {p.individualCost > 0 ? `${data.currency} ${p.individualCost.toLocaleString()}` : "—"}
              </Text>
            </View>
          ))}
          {passengerTotal > 0 && (
            <View style={{ ...s.tableRow, backgroundColor: "#f0fdf4" }}>
              <Text style={{ ...s.tdCell, flex: 7.5, fontFamily: "Helvetica-Bold", color: colors.green }}>Passenger Total</Text>
              <Text style={{ ...s.tdCell, flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", color: colors.green }}>
                {data.currency} {passengerTotal.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Payment History */}
        {data.payments.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={s.sectionTitle}>Payment History</Text>
            <View style={s.tableHeader}>
              <Text style={{ ...s.thCell, flex: 1.5 }}>Date</Text>
              <Text style={{ ...s.thCell, flex: 1.5 }}>Method</Text>
              <Text style={{ ...s.thCell, flex: 2 }}>Reference</Text>
              <Text style={{ ...s.thCell, flex: 1 }}>Status</Text>
              <Text style={{ ...s.thCell, flex: 1, textAlign: "right" }}>Amount</Text>
            </View>
            {data.payments.map((pay, i) => (
              <View key={i} style={i % 2 === 0 ? s.paymentRow : { ...s.paymentRow, backgroundColor: colors.light }}>
                <Text style={{ ...s.tdCell, flex: 1.5 }}>{fmt(pay.paidAt)}</Text>
                <Text style={{ ...s.tdCell, flex: 1.5 }}>{pay.method.replace(/_/g, " ")}</Text>
                <Text style={{ ...s.tdCell, flex: 2 }}>{pay.reference ?? "—"}</Text>
                <Text style={{ ...s.tdCell, flex: 1, color: pay.status === "PAID" ? colors.green : colors.muted }}>{pay.status}</Text>
                <Text style={{ ...s.tdCell, flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", color: colors.green }}>
                  {data.currency} {pay.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Financial summary */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", padding: "7 10", borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ flex: 1, fontSize: 9, color: colors.muted }}>Total Package Price</Text>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{data.currency} {data.totalAmount.toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: "row", padding: "7 10", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#f0fdf4" }}>
              <Text style={{ flex: 1, fontSize: 9, color: colors.muted }}>Amount Paid</Text>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.green }}>{data.currency} {data.paidAmount.toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: "row", padding: "9 10", backgroundColor: balance > 0 ? "#fff1f2" : "#f0fdf4" }}>
              <Text style={{ flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", color: balance > 0 ? colors.red : colors.green }}>
                {balance > 0 ? "Balance Due" : "Fully Paid"}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: balance > 0 ? colors.red : colors.green }}>
                {data.currency} {Math.abs(balance).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {data.specialRequests && (
          <View style={{ backgroundColor: "#fffbeb", borderRadius: 6, padding: "8 10", borderLeftWidth: 3, borderLeftColor: "#f59e0b" }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#92400e", marginBottom: 3 }}>SPECIAL REQUESTS</Text>
            <Text style={{ fontSize: 8, color: "#92400e", lineHeight: 1.4 }}>{data.specialRequests}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{data.invoiceFooter ?? `${companyName} · Booking Invoice · ${invoiceRef}`}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
