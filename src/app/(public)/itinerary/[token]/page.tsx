import { getPublicItinerary } from "@/lib/actions/itineraries";
import { format } from "date-fns";
import {
  Plane,
  Hotel,
  Zap,
  Car,
  Utensils,
  Sunrise,
  Tag,
  CheckCircle2,
  Globe,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Building2,
  Users,
} from "lucide-react";
import { ApproveButton } from "./approve-button";
import { PrintButton } from "./print-button";

interface PublicItineraryPageProps {
  params: Promise<{ token: string }>;
}

const ITEM_TYPE_ICONS: Record<string, React.ElementType> = {
  FLIGHT: Plane,
  HOTEL: Hotel,
  ACTIVITY: Zap,
  TRANSFER: Car,
  MEAL: Utensils,
  FREE_TIME: Sunrise,
  OTHER: Tag,
};

const ITEM_TYPE_COLORS: Record<string, { pill: string; icon: string; border: string; bg: string }> = {
  FLIGHT:    { pill: "bg-blue-100 text-blue-700 border border-blue-200",    icon: "bg-blue-500 text-white",    border: "border-blue-400",   bg: "bg-blue-50" },
  HOTEL:     { pill: "bg-purple-100 text-purple-700 border border-purple-200", icon: "bg-purple-500 text-white", border: "border-purple-400", bg: "bg-purple-50" },
  ACTIVITY:  { pill: "bg-orange-100 text-orange-700 border border-orange-200", icon: "bg-orange-500 text-white", border: "border-orange-400", bg: "bg-orange-50" },
  TRANSFER:  { pill: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: "bg-emerald-500 text-white", border: "border-emerald-400", bg: "bg-emerald-50" },
  MEAL:      { pill: "bg-red-100 text-red-700 border border-red-200",       icon: "bg-red-500 text-white",    border: "border-red-400",    bg: "bg-red-50" },
  FREE_TIME: { pill: "bg-yellow-100 text-yellow-700 border border-yellow-200", icon: "bg-yellow-500 text-white", border: "border-yellow-400", bg: "bg-yellow-50" },
  OTHER:     { pill: "bg-gray-100 text-gray-600 border border-gray-200",    icon: "bg-gray-500 text-white",    border: "border-gray-400",   bg: "bg-gray-50" },
};

const DAY_GRADIENTS = [
  "from-indigo-50 via-white to-purple-50",
  "from-blue-50 via-white to-cyan-50",
  "from-violet-50 via-white to-pink-50",
  "from-amber-50 via-white to-orange-50",
  "from-emerald-50 via-white to-teal-50",
  "from-rose-50 via-white to-red-50",
];

export default async function PublicItineraryPage({ params }: PublicItineraryPageProps) {
  const { token } = await params;
  const itinerary = await getPublicItinerary(token);

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Itinerary Not Found</h1>
          <p className="text-indigo-200 text-base">This itinerary link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const isApproved = itinerary.status === "APPROVED" || itinerary.status === "BOOKED";
  const includedItems = itinerary.days.flatMap((d) => d.items.filter((i) => i.isIncluded));
  const optionalItems = itinerary.days.flatMap((d) => d.items.filter((i) => !i.isIncluded));
  const includedTotal = includedItems.reduce((sum, i) => sum + i.totalCost, 0);
  const optionalTotal = optionalItems.reduce((sum, i) => sum + i.totalCost, 0);

  // Extract unique destinations from day locations
  const destinations = [...new Set(itinerary.days.map((d) => d.location).filter(Boolean))];
  const heroDestination = destinations.length > 0 ? destinations.join(" · ") : itinerary.title;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-full { width: 100% !important; max-width: 100% !important; }
          .page-break { page-break-before: always; }
          @page { margin: 0.5cm; size: A4; }
          .poster-hero { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .poster-hero {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #6d28d9 100%);
        }
        .hero-pattern {
          background-image: radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(167, 139, 250, 0.2) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
        }
        .gold-badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -1px;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, currentColor, transparent);
        }
      `}</style>

      <div className="min-h-screen bg-gray-100">
        {/* ═══════════════════════════════════════ HERO BANNER ═══════════════════════════════════════ */}
        <div className="poster-hero hero-pattern relative overflow-hidden print-full">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-48 translate-x-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-32 -translate-x-32" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-purple-500/20" />

          <div className="relative max-w-5xl mx-auto px-8 py-16 print-full">
            {/* Company Logo Placeholder */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-[0.2em]">Zeno Trip</p>
                  <p className="text-white font-bold text-sm">Your Premium Travel Partner</p>
                </div>
              </div>
              {isApproved && (
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-emerald-200 text-sm font-semibold">Approved</span>
                </div>
              )}
            </div>

            {/* Main Title Block */}
            <div className="text-center mb-10">
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-[0.3em] mb-3">
                ✦ Exclusive Travel Itinerary ✦
              </p>
              <h1 className="text-5xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
                {heroDestination}
              </h1>
              {itinerary.title !== heroDestination && (
                <p className="text-indigo-200 text-xl mt-2 font-light">{itinerary.title}</p>
              )}
            </div>

            {/* Meta Info Row */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {itinerary.contact && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20">
                  <Users className="w-4 h-4 text-indigo-200" />
                  <span className="text-white text-sm font-medium">
                    {itinerary.contact.firstName} {itinerary.contact.lastName}
                  </span>
                </div>
              )}
              {itinerary.startDate && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20">
                  <Calendar className="w-4 h-4 text-indigo-200" />
                  <span className="text-white text-sm font-medium">
                    {format(new Date(itinerary.startDate), "MMM d")}
                    {itinerary.endDate ? ` – ${format(new Date(itinerary.endDate), "MMM d, yyyy")}` : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-amber-400/20 backdrop-blur-sm rounded-full px-5 py-2.5 border border-amber-300/30">
                <DollarSign className="w-4 h-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-bold">
                  {itinerary.currency} {itinerary.totalCost.toLocaleString()}
                </span>
                <span className="text-amber-300/60 text-xs">total</span>
              </div>
              {itinerary.days.length > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20">
                  <span className="text-white text-sm font-medium">{itinerary.days.length} Days</span>
                </div>
              )}
            </div>

            {isApproved && itinerary.approvedAt && (
              <p className="text-center text-indigo-300 text-xs mt-6 font-medium">
                Approved on {format(new Date(itinerary.approvedAt), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════ CONTENT AREA ═══════════════════════════════════════ */}
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 print-full">

          {/* ─── DAY CARDS ─── */}
          {itinerary.days.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-base">No itinerary days have been added yet.</p>
            </div>
          ) : (
            itinerary.days.map((day, idx) => {
              const gradientClass = DAY_GRADIENTS[idx % DAY_GRADIENTS.length];
              return (
                <div
                  key={day.id}
                  className={`rounded-2xl overflow-hidden shadow-md border border-gray-200/80 bg-gradient-to-br ${gradientClass}`}
                >
                  {/* Day Card Header */}
                  <div className="px-8 py-6 flex items-start gap-6 border-b border-gray-200/60">
                    {/* Day Number Badge */}
                    <div className="gold-badge w-16 h-16 rounded-full flex flex-col items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white text-xs font-bold uppercase tracking-wider leading-none">Day</span>
                      <span className="text-white text-2xl font-bold leading-tight">{day.dayNumber}</span>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Georgia, serif" }}>
                        {day.title ?? `Day ${day.dayNumber}`}
                      </h2>
                      {day.location && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium text-indigo-600">{day.location}</span>
                        </div>
                      )}
                      {day.description && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{day.description}</p>
                      )}
                    </div>

                    {day.date && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-gray-800">{format(new Date(day.date), "d")}</p>
                        <p className="text-sm font-semibold text-gray-500">{format(new Date(day.date), "MMM")}</p>
                        <p className="text-xs text-gray-400">{format(new Date(day.date), "EEE")}</p>
                      </div>
                    )}
                  </div>

                  {/* Items Timeline */}
                  <div className="px-8 py-4">
                    {day.items.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-6">No activities scheduled</p>
                    ) : (
                      <div className="space-y-4">
                        {day.items.map((item, itemIdx) => {
                          const Icon = ITEM_TYPE_ICONS[item.type] ?? Tag;
                          const colors = ITEM_TYPE_COLORS[item.type] ?? ITEM_TYPE_COLORS.OTHER;
                          return (
                            <div key={item.id} className="flex items-start gap-4">
                              {/* Left timeline */}
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon} shadow-sm`}>
                                  <Icon className="w-4.5 h-4.5" style={{ width: "1.1rem", height: "1.1rem" }} />
                                </div>
                                {itemIdx < day.items.length - 1 && (
                                  <div className="w-0.5 h-4 bg-gray-200 mt-1" />
                                )}
                              </div>

                              {/* Content */}
                              <div className={`flex-1 rounded-xl p-4 border-l-4 ${colors.border} ${colors.bg} border border-gray-200/50`}>
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.pill}`}>
                                        {item.type.replace("_", " ")}
                                      </span>
                                      {!item.isIncluded && (
                                        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                          Optional Add-on
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{item.description}</p>
                                    )}

                                    {/* Meta info row */}
                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                      {(item.startTime || item.endTime) && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                                          {item.startTime}{item.endTime ? ` – ${item.endTime}` : ""}
                                        </span>
                                      )}
                                      {item.location && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                          {item.location}
                                        </span>
                                      )}
                                      {item.supplier && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                          {item.supplier}
                                        </span>
                                      )}
                                      {item.confirmationRef && (
                                        <span className="text-xs text-gray-500 font-mono bg-white/80 border border-gray-200 px-1.5 py-0.5 rounded">
                                          Ref: {item.confirmationRef}
                                        </span>
                                      )}
                                    </div>

                                    {item.notes && (
                                      <p className="text-xs text-gray-400 mt-1.5 italic">{item.notes}</p>
                                    )}
                                  </div>

                                  {item.totalCost > 0 && (
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-base font-bold text-gray-900">
                                        {item.currency} {item.totalCost.toLocaleString()}
                                      </p>
                                      {item.quantity > 1 && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          {item.quantity} × {item.currency} {item.unitCost.toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* ─── COST SUMMARY ─── */}
          {(includedItems.length > 0 || optionalItems.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-5">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
                  Cost Summary
                </h3>
                <p className="text-slate-300 text-sm mt-0.5">A complete breakdown of your travel investment</p>
              </div>

              <div className="p-8 space-y-6">
                {/* What's Included */}
                {includedItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-bold text-gray-800 text-base">What&apos;s Included</h4>
                    </div>
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 overflow-hidden">
                      {includedItems.map((item, idx) => (
                        <div key={item.id} className={`flex items-center justify-between px-5 py-3 ${idx > 0 ? "border-t border-emerald-100" : ""}`}>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(ITEM_TYPE_COLORS[item.type] ?? ITEM_TYPE_COLORS.OTHER).pill}`}>
                              {item.type.replace("_", " ")}
                            </span>
                            <span className="text-sm text-gray-700 font-medium">{item.title}</span>
                          </div>
                          {item.totalCost > 0 && (
                            <span className="text-sm font-bold text-gray-900">
                              {item.currency} {item.totalCost.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-100 border-t border-emerald-200">
                        <span className="text-sm font-bold text-emerald-800">Package Subtotal</span>
                        <span className="text-base font-bold text-emerald-700">
                          {itinerary.currency} {includedTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Add-ons */}
                {optionalItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-gray-800 text-base">Optional Add-ons</h4>
                    </div>
                    <div className="bg-amber-50 rounded-xl border border-amber-100 overflow-hidden">
                      {optionalItems.map((item, idx) => (
                        <div key={item.id} className={`flex items-center justify-between px-5 py-3 ${idx > 0 ? "border-t border-amber-100" : ""}`}>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(ITEM_TYPE_COLORS[item.type] ?? ITEM_TYPE_COLORS.OTHER).pill}`}>
                              {item.type.replace("_", " ")}
                            </span>
                            <span className="text-sm text-gray-700 font-medium">{item.title}</span>
                          </div>
                          {item.totalCost > 0 && (
                            <span className="text-sm font-bold text-gray-900">
                              {item.currency} {item.totalCost.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-5 py-3.5 bg-amber-100 border-t border-amber-200">
                        <span className="text-sm font-bold text-amber-800">Add-ons Subtotal</span>
                        <span className="text-base font-bold text-amber-700">
                          {itinerary.currency} {optionalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grand Total */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Total Package Value</p>
                      <p className="text-white text-sm mt-0.5">(Included items only)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-3xl font-bold">
                        {itinerary.currency} {includedTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── APPROVAL SECTION ─── */}
          {!isApproved && itinerary.status === "SHARED" && (
            <div className="no-print bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4">
                <p className="text-white font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>Ready to Make Your Dream Trip a Reality?</p>
              </div>
              <div className="px-8 py-8 text-center">
                <div className="max-w-lg mx-auto">
                  <CheckCircle2 className="w-14 h-14 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
                    Approve This Itinerary
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    By approving this itinerary, you confirm the details look correct and you&apos;d like to proceed with booking.
                    Your travel agent will be in touch shortly to finalise arrangements.
                  </p>
                  <ApproveButton shareToken={token} />
                </div>
              </div>
            </div>
          )}

          {/* Already Approved Banner */}
          {isApproved && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-center shadow-lg">
              <CheckCircle2 className="w-14 h-14 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Georgia, serif" }}>
                Itinerary Approved!
              </h3>
              <p className="text-emerald-100 text-base">
                Thank you for approving this itinerary. Your travel agent will be in touch shortly to finalise your booking.
              </p>
            </div>
          )}

      <PrintButton />

          {/* Footer */}
          <div className="text-center py-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-gray-600">Zeno Trip</span>
            </div>
            <p className="text-xs text-gray-400">This itinerary was prepared exclusively for you · All prices include applicable taxes</p>
          </div>
        </div>
      </div>
    </>
  );
}
