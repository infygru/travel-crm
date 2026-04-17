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
  amber: "#d97706",
  red: "#dc2626",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: colors.text, backgroundColor: "#ffffff", padding: 0 },
  header: { backgroundColor: colors.primary, padding: "32 36 28 36" },
  headerBadge: { fontSize: 8, color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: "flex-start", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  headerTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 6, lineHeight: 1.2 },
  headerSubtitle: { fontSize: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.4, marginBottom: 14 },
  headerStats: { flexDirection: "row", gap: 0, marginTop: 4 },
  headerStat: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderRadius: 6, minWidth: 90 },
  headerStatValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  headerStatLabel: { fontSize: 8, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  body: { padding: "22 36" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8, borderBottomWidth: 1, borderBottomColor: "#e0e7ff", paddingBottom: 4 },
  twoCol: { flexDirection: "row", gap: 14 },
  col: { flex: 1 },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 5 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 1.5, flexShrink: 0 },
  listText: { fontSize: 9, color: colors.text, flex: 1, lineHeight: 1.4 },
  highlightCard: { backgroundColor: "#ede9fe", borderRadius: 6, padding: "8 10", marginBottom: 6, borderLeftWidth: 3, borderLeftColor: colors.primary },
  highlightText: { fontSize: 9, color: "#3730a3", lineHeight: 1.4 },
  dayCard: { marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: "hidden" },
  dayHeader: { backgroundColor: colors.light, padding: "7 10", flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  dayTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.primaryDark },
  dayLocation: { fontSize: 8, color: colors.muted },
  dayBody: { padding: "6 10" },
  dayActivities: { fontSize: 8, color: colors.text, lineHeight: 1.4 },
  dayMeta: { flexDirection: "row", gap: 10, marginTop: 4 },
  dayMetaBadge: { fontSize: 7, color: colors.muted, backgroundColor: "#f3f4f6", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  pricingTable: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: "hidden" },
  pricingHeader: { flexDirection: "row", backgroundColor: colors.primary, padding: "7 10" },
  pricingHeaderCell: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  pricingRow: { flexDirection: "row", padding: "7 10", borderBottomWidth: 1, borderBottomColor: colors.border },
  pricingRowAlt: { flexDirection: "row", padding: "7 10", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.light },
  pricingCell: { flex: 1, fontSize: 9, color: colors.text },
  pricingCellBold: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.primary },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  footerText: { fontSize: 8, color: colors.muted },
});

export type PackagePDFData = {
  name: string;
  code?: string | null;
  description?: string | null;
  category: string;
  duration: number;
  basePrice: number;
  currency: string;
  minPax: number;
  maxPax?: number | null;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  difficulty?: string | null;
  destinations: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description?: string | null;
    location?: string | null;
    meals: string[];
    activities: string[];
    accommodation?: string | null;
    transport?: string | null;
  }>;
};

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Travel CRM";

export function PackagePDFDocument({ data }: { data: PackagePDFData }) {
  const categoryLabel = data.category.replace(/_/g, " ");

  return (
    <Document title={data.name} author={COMPANY_NAME} subject="Travel Package">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerBadge}>{categoryLabel}</Text>
          <Text style={s.headerTitle}>{data.name}</Text>
          {data.description && (
            <Text style={s.headerSubtitle}>{data.description}</Text>
          )}
          {data.destinations.length > 0 && (
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginBottom: 14 }}>
              {data.destinations.join("  ·  ")}
            </Text>
          )}
          <View style={s.headerStats}>
            <View style={s.headerStat}>
              <Text style={s.headerStatValue}>{data.duration}</Text>
              <Text style={s.headerStatLabel}>Days</Text>
            </View>
            <View style={s.headerStat}>
              <Text style={s.headerStatValue}>{data.currency} {data.basePrice.toLocaleString()}</Text>
              <Text style={s.headerStatLabel}>from / person</Text>
            </View>
            <View style={s.headerStat}>
              <Text style={s.headerStatValue}>{data.minPax}{data.maxPax ? `–${data.maxPax}` : "+"}</Text>
              <Text style={s.headerStatLabel}>Pax</Text>
            </View>
            {data.difficulty && (
              <View style={s.headerStat}>
                <Text style={s.headerStatValue}>{data.difficulty}</Text>
                <Text style={s.headerStatLabel}>Level</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.body}>
          {/* Highlights */}
          {data.highlights.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Highlights</Text>
              {data.highlights.map((h, i) => (
                <View key={i} style={s.highlightCard}>
                  <Text style={s.highlightText}>★  {h}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Inclusions & Exclusions */}
          {(data.inclusions.length > 0 || data.exclusions.length > 0) && (
            <View style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>What&apos;s Included / Not Included</Text>
              <View style={s.twoCol}>
                <View style={s.col}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.green, marginBottom: 6 }}>Included</Text>
                  {data.inclusions.map((inc, i) => (
                    <View key={i} style={s.listItem}>
                      <View style={{ ...s.bullet, backgroundColor: colors.green }} />
                      <Text style={s.listText}>{inc}</Text>
                    </View>
                  ))}
                  {data.inclusions.length === 0 && <Text style={{ fontSize: 8, color: colors.muted }}>—</Text>}
                </View>
                <View style={s.col}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.red, marginBottom: 6 }}>Not Included</Text>
                  {data.exclusions.map((exc, i) => (
                    <View key={i} style={s.listItem}>
                      <View style={{ ...s.bullet, backgroundColor: colors.red }} />
                      <Text style={s.listText}>{exc}</Text>
                    </View>
                  ))}
                  {data.exclusions.length === 0 && <Text style={{ fontSize: 8, color: colors.muted }}>—</Text>}
                </View>
              </View>
            </View>
          )}

          {/* Itinerary */}
          {data.itinerary.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Day-by-Day Itinerary</Text>
              {data.itinerary.map((day, i) => (
                <View key={i} style={s.dayCard} wrap={false}>
                  <View style={s.dayHeader}>
                    <Text style={s.dayTitle}>Day {day.day} — {day.title}</Text>
                    {day.location && <Text style={s.dayLocation}>{day.location}</Text>}
                  </View>
                  <View style={s.dayBody}>
                    {day.description && (
                      <Text style={{ fontSize: 8, color: colors.text, lineHeight: 1.4, marginBottom: 5 }}>{day.description}</Text>
                    )}
                    {day.activities.length > 0 && (
                      <Text style={s.dayActivities}>{day.activities.join("  ·  ")}</Text>
                    )}
                    <View style={s.dayMeta}>
                      {day.accommodation && <Text style={s.dayMetaBadge}>Hotel: {day.accommodation}</Text>}
                      {day.transport && <Text style={s.dayMetaBadge}>Transport: {day.transport}</Text>}
                      {day.meals.length > 0 && <Text style={s.dayMetaBadge}>Meals: {day.meals.join(", ")}</Text>}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Pricing */}
          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>Pricing</Text>
            <View style={s.pricingTable}>
              <View style={s.pricingHeader}>
                <Text style={s.pricingHeaderCell}>Package</Text>
                <Text style={s.pricingHeaderCell}>Code</Text>
                <Text style={s.pricingHeaderCell}>Duration</Text>
                <Text style={s.pricingHeaderCell}>Pax</Text>
                <Text style={s.pricingHeaderCell}>Price / Person</Text>
              </View>
              <View style={s.pricingRow}>
                <Text style={s.pricingCellBold}>{data.name}</Text>
                <Text style={s.pricingCell}>{data.code ?? "—"}</Text>
                <Text style={s.pricingCell}>{data.duration} Days</Text>
                <Text style={s.pricingCell}>{data.minPax}{data.maxPax ? `–${data.maxPax}` : "+"}</Text>
                <Text style={s.pricingCellBold}>{data.currency} {data.basePrice.toLocaleString()}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 6 }}>
              * Prices are per person based on twin sharing. Subject to availability and seasonal surcharges.
              Contact us for group rates and custom quotes.
            </Text>
          </View>

          {/* Terms placeholder */}
          <View style={{ backgroundColor: "#fefce8", borderRadius: 6, padding: "10 12", borderLeftWidth: 3, borderLeftColor: colors.amber }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.amber, marginBottom: 4 }}>BOOKING TERMS & CONDITIONS</Text>
            <Text style={{ fontSize: 8, color: "#92400e", lineHeight: 1.5 }}>
              A deposit of 25% is required to confirm your booking. Full payment is due 30 days prior to departure.
              Cancellations within 30 days of departure are subject to cancellation fees as per our standard policy.
              {COMPANY_NAME} reserves the right to substitute accommodation or services of equal or superior standard.
              Prices are subject to change until booking is confirmed. Passport validity of at least 6 months is required.
              Travel insurance is strongly recommended.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{COMPANY_NAME} · Package Brochure · {data.name}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
