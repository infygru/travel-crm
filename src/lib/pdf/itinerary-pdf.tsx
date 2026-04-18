import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const colors = {
  primary: "#4f46e5",
  primaryDark: "#3730a3",
  text: "#111827",
  muted: "#6b7280",
  light: "#f9fafb",
  border: "#e5e7eb",
  green: "#059669",
  amber: "#d97706",
  blue: "#2563eb",
  purple: "#7c3aed",
  red: "#dc2626",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: colors.text, backgroundColor: "#ffffff", padding: 0 },
  header: { backgroundColor: colors.primary, padding: "28 36 24 36", marginBottom: 0 },
  headerTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 4 },
  headerSubtitle: { fontSize: 10, color: "rgba(255,255,255,0.8)" },
  headerMeta: { flexDirection: "row", gap: 20, marginTop: 12 },
  headerMetaItem: { flexDirection: "row", gap: 4 },
  headerMetaLabel: { fontSize: 9, color: "rgba(255,255,255,0.65)" },
  headerMetaValue: { fontSize: 9, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  body: { padding: "20 36" },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 },
  dayCard: { marginBottom: 14, borderRadius: 6, overflow: "hidden" },
  dayHeader: { backgroundColor: colors.primary, padding: "8 12", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayHeaderText: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  dayHeaderDate: { fontSize: 9, color: "rgba(255,255,255,0.8)" },
  dayLocation: { fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  dayBody: { backgroundColor: colors.light, padding: "8 12" },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemBadge: { fontSize: 7, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, color: "#ffffff", fontFamily: "Helvetica-Bold", minWidth: 50, textAlign: "center" },
  itemTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text, flex: 1 },
  itemDesc: { fontSize: 8, color: colors.muted, marginTop: 2, flex: 1 },
  itemTime: { fontSize: 8, color: colors.muted },
  itemCost: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.green },
  summaryTable: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: "hidden" },
  summaryRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, padding: "8 12" },
  summaryRowLast: { flexDirection: "row", padding: "8 12", backgroundColor: "#ede9fe" },
  summaryLabel: { flex: 1, fontSize: 9, color: colors.muted },
  summaryValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },
  summaryValueTotal: { fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  footerText: { fontSize: 8, color: colors.muted },
  infoGrid: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  infoCard: { flex: 1, minWidth: 120, backgroundColor: colors.light, borderRadius: 6, padding: "8 10", borderWidth: 1, borderColor: colors.border },
  infoLabel: { fontSize: 8, color: colors.muted, marginBottom: 3 },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },
});

type ItemType = "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER" | "MEAL" | "FREE_TIME" | "OTHER";

const ITEM_BADGE_COLORS: Record<ItemType, string> = {
  FLIGHT: "#2563eb",
  HOTEL: "#7c3aed",
  ACTIVITY: "#059669",
  TRANSFER: "#d97706",
  MEAL: "#db2777",
  FREE_TIME: "#6b7280",
  OTHER: "#374151",
};

function itemBadgeColor(type: string): string {
  return ITEM_BADGE_COLORS[type as ItemType] ?? "#374151";
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export type ItineraryPDFData = {
  title: string;
  description?: string | null;
  status: string;
  totalCost: number;
  currency: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  notes?: string | null;
  contact?: { firstName: string; lastName: string; email?: string | null } | null;
  createdBy?: { name?: string | null } | null;
  days: Array<{
    dayNumber: number;
    date?: Date | string | null;
    title?: string | null;
    description?: string | null;
    location?: string | null;
    items: Array<{
      type: string;
      title: string;
      description?: string | null;
      location?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      supplier?: string | null;
      confirmationRef?: string | null;
      unitCost: number;
      quantity: number;
      totalCost: number;
      currency: string;
      isIncluded: boolean;
    }>;
  }>;
};

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Zeno Trip";

export function ItineraryPDFDocument({ data }: { data: ItineraryPDFData }) {
  const totalDays = data.days.length;
  const includedCost = data.days.flatMap(d => d.items).filter(i => i.isIncluded).reduce((s, i) => s + i.totalCost, 0);
  const extrasCost = data.days.flatMap(d => d.items).filter(i => !i.isIncluded).reduce((s, i) => s + i.totalCost, 0);

  return (
    <Document title={data.title} author={COMPANY_NAME} subject="Travel Itinerary">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>{data.title}</Text>
          {data.contact && (
            <Text style={s.headerSubtitle}>
              Prepared for: {data.contact.firstName} {data.contact.lastName}
              {data.contact.email ? `  ·  ${data.contact.email}` : ""}
            </Text>
          )}
          <View style={s.headerMeta}>
            <View style={s.headerMetaItem}>
              <Text style={s.headerMetaLabel}>Duration:</Text>
              <Text style={s.headerMetaValue}>{totalDays} Day{totalDays !== 1 ? "s" : ""}</Text>
            </View>
            {data.startDate && (
              <View style={s.headerMetaItem}>
                <Text style={s.headerMetaLabel}>From:</Text>
                <Text style={s.headerMetaValue}>{formatDate(data.startDate)}</Text>
              </View>
            )}
            {data.endDate && (
              <View style={s.headerMetaItem}>
                <Text style={s.headerMetaLabel}>To:</Text>
                <Text style={s.headerMetaValue}>{formatDate(data.endDate)}</Text>
              </View>
            )}
            <View style={s.headerMetaItem}>
              <Text style={s.headerMetaLabel}>Total Cost:</Text>
              <Text style={s.headerMetaValue}>{data.currency} {data.totalCost.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Description */}
          {data.description && (
            <View style={{ ...s.section, backgroundColor: "#ede9fe", borderRadius: 6, padding: "10 12", borderLeftWidth: 3, borderLeftColor: colors.primary }}>
              <Text style={{ fontSize: 9, color: "#3730a3", lineHeight: 1.5 }}>{data.description}</Text>
            </View>
          )}

          {/* Day-by-day */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Day-by-Day Programme</Text>
            {data.days.map((day) => (
              <View key={day.dayNumber} style={s.dayCard} wrap={false}>
                <View style={s.dayHeader}>
                  <View>
                    <Text style={s.dayHeaderText}>Day {day.dayNumber}{day.title ? ` — ${day.title}` : ""}</Text>
                    {day.location && <Text style={s.dayLocation}>{day.location}</Text>}
                  </View>
                  {day.date && <Text style={s.dayHeaderDate}>{formatDate(day.date)}</Text>}
                </View>
                <View style={s.dayBody}>
                  {day.description && (
                    <Text style={{ fontSize: 8, color: colors.muted, marginBottom: 6, lineHeight: 1.4 }}>{day.description}</Text>
                  )}
                  {day.items.length === 0 ? (
                    <Text style={{ fontSize: 8, color: colors.muted, fontStyle: "italic" }}>No items scheduled</Text>
                  ) : (
                    day.items.map((item, idx) => (
                      <View key={idx} style={s.itemRow}>
                        <Text style={{ ...s.itemBadge, backgroundColor: itemBadgeColor(item.type) }}>
                          {item.type.replace("_", " ")}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.itemTitle}>{item.title}</Text>
                          {item.description && <Text style={s.itemDesc}>{item.description}</Text>}
                          <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                            {item.startTime && <Text style={s.itemTime}>{item.startTime}{item.endTime ? ` – ${item.endTime}` : ""}</Text>}
                            {item.supplier && <Text style={s.itemTime}>Supplier: {item.supplier}</Text>}
                            {item.confirmationRef && <Text style={s.itemTime}>Ref: {item.confirmationRef}</Text>}
                            {item.location && <Text style={s.itemTime}>{item.location}</Text>}
                          </View>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          {item.totalCost > 0 && (
                            <Text style={item.isIncluded ? s.itemCost : { ...s.itemCost, color: colors.amber }}>
                              {item.currency} {item.totalCost.toLocaleString()}
                            </Text>
                          )}
                          {!item.isIncluded && (
                            <Text style={{ fontSize: 7, color: colors.amber }}>Extra</Text>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Cost Summary */}
          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>Cost Summary</Text>
            <View style={s.summaryTable}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Included Services</Text>
                <Text style={s.summaryValue}>{data.currency} {includedCost.toLocaleString()}</Text>
              </View>
              {extrasCost > 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Optional Extras</Text>
                  <Text style={{ ...s.summaryValue, color: colors.amber }}>{data.currency} {extrasCost.toLocaleString()}</Text>
                </View>
              )}
              <View style={s.summaryRowLast}>
                <Text style={{ ...s.summaryLabel, fontFamily: "Helvetica-Bold", color: colors.primaryDark }}>Total Investment</Text>
                <Text style={s.summaryValueTotal}>{data.currency} {data.totalCost.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {data.notes && (
            <View style={{ ...s.section, backgroundColor: "#fefce8", borderRadius: 6, padding: "10 12", borderLeftWidth: 3, borderLeftColor: colors.amber }}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.amber, marginBottom: 4 }}>NOTES & CONDITIONS</Text>
              <Text style={{ fontSize: 8, color: "#92400e", lineHeight: 1.5 }}>{data.notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{COMPANY_NAME} · Travel Itinerary · {data.title}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
