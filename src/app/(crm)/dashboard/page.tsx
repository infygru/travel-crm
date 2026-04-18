import { auth } from "@/auth";
import {
  getDashboardStats,
  getRevenueByMonth,
  getTopAgents,
  getTasksDueToday,
  getUpcomingDepartures,
  getPaymentAlerts,
  getPendingBookings,
  getPassportExpiryAlerts,
} from "@/lib/actions/dashboard";
import { getCompanySettings } from "@/lib/actions/settings";
import { formatCurrency } from "@/lib/currency";
import {
  Plane,
  AlertTriangle,
  Clock,
  CheckCircle2,
  IndianRupee,
  DollarSign,
  Euro,
  PoundSterling,
  BadgeDollarSign,
  TrendingUp,
  Users,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  CreditCard,
  FileWarning,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

const CURRENCY_ICONS: Record<string, LucideIcon> = {
  INR: IndianRupee,
  USD: DollarSign,
  EUR: Euro,
  GBP: PoundSterling,
};
function getCurrencyIcon(currency: string): LucideIcon {
  return CURRENCY_ICONS[currency] ?? BadgeDollarSign;
}
import { BOOKING_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import { format, differenceInDays } from "date-fns";
import { RevenueChart } from "@/components/charts/revenue-chart";
import Link from "next/link";

function DaysUntilBadge({ date }: { date: Date }) {
  const days = differenceInDays(new Date(date), new Date());
  if (days < 0) return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Departed</span>;
  if (days === 0) return <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">TODAY</span>;
  if (days <= 2) return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{days}d away</span>;
  if (days <= 7) return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{days}d away</span>;
  return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{days}d away</span>;
}

export default async function DashboardPage() {
  const session = await auth();

  const [
    stats,
    revenueData,
    topAgents,
    tasksDueToday,
    upcomingDepartures,
    paymentAlerts,
    pendingBookings,
    passportAlerts,
    settings,
  ] = await Promise.all([
    getDashboardStats(),
    getRevenueByMonth(),
    getTopAgents(5),
    getTasksDueToday(),
    getUpcomingDepartures(14),
    getPaymentAlerts(),
    getPendingBookings(),
    getPassportExpiryAlerts(90),
    getCompanySettings(),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const totalAlerts =
    paymentAlerts.length +
    pendingBookings.length +
    passportAlerts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-gray-700">{greeting}, </span>
            <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
            {totalAlerts > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-rose-500 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {totalAlerts} item{totalAlerts !== 1 ? "s" : ""} need attention
              </span>
            )}
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link href="/leads" className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-sm">
            <UserPlus className="w-3.5 h-3.5" /> Add Lead
          </Link>
          <Link href="/deals" className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors">
            <TrendingUp className="w-3.5 h-3.5" /> Deals
          </Link>
          <Link href="/itineraries/new" className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-violet-50/40 transition-colors">
            <Plane className="w-3.5 h-3.5" /> New Itinerary
          </Link>
        </div>
      </div>

      {/* ── ALERT STRIP ────────────────────────────────────────────── */}
      {totalAlerts > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pendingBookings.length > 0 && (
            <Link href="/bookings?status=PENDING" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">{pendingBookings.length} Pending Confirmation</p>
                <p className="text-xs text-amber-700">Awaiting your action</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {paymentAlerts.length > 0 && (
            <Link href="/bookings?paymentStatus=PARTIAL" className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">{paymentAlerts.length} Payment{paymentAlerts.length !== 1 ? "s" : ""} Outstanding</p>
                <p className="text-xs text-red-700">
                  {(() => {
                    const total = paymentAlerts.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);
                    return `${formatCurrency(total, settings.currency)} balance due`;
                  })()}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {passportAlerts.length > 0 && (
            <Link href="/bookings" className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-2xl hover:bg-purple-100 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FileWarning className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-purple-900">{passportAlerts.length} Passport{passportAlerts.length !== 1 ? "s" : ""} Expiring</p>
                <p className="text-xs text-purple-700">Within 90 days — check before travel</p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* ── KPI CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Revenue (All Time)",
            value: formatCurrency(stats.totalRevenue, settings.currency, { maximumFractionDigits: 0 }),
            change: stats.prevMonthRevenue > 0
              ? ((stats.totalRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue) * 100
              : null,
            icon: getCurrencyIcon(settings.currency),
            iconGradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            cardAccent: "from-emerald-50/80 to-white",
            borderColor: "border-emerald-100",
            valueColor: "text-emerald-700",
          },
          {
            label: "Active Bookings",
            value: stats.activeBookings.toString(),
            change: stats.prevActiveBookings > 0
              ? ((stats.activeBookings - stats.prevActiveBookings) / stats.prevActiveBookings) * 100
              : null,
            icon: CalendarCheck,
            iconGradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            cardAccent: "from-sky-50/80 to-white",
            borderColor: "border-sky-100",
            valueColor: "text-sky-700",
          },
          {
            label: "New Leads (30d)",
            value: stats.newLeads.toString(),
            change: stats.prevNewLeads > 0
              ? ((stats.newLeads - stats.prevNewLeads) / stats.prevNewLeads) * 100
              : null,
            icon: Users,
            iconGradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
            cardAccent: "from-violet-50/80 to-white",
            borderColor: "border-violet-100",
            valueColor: "text-violet-700",
          },
          {
            label: "Deal Conversion",
            value: `${stats.conversionRate.toFixed(1)}%`,
            change: null,
            icon: TrendingUp,
            iconGradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
            cardAccent: "from-amber-50/80 to-white",
            borderColor: "border-amber-100",
            valueColor: "text-amber-700",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative bg-gradient-to-br ${card.cardAccent} rounded-2xl border ${card.borderColor} p-5 card-glow card-glow-hover overflow-hidden`}
            >
              {/* Background decoration */}
              <div
                className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.06]"
                style={{ background: card.iconGradient }}
              />
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: card.iconGradient }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {card.change !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    card.change >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(card.change).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── UPCOMING DEPARTURES ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-violet-100/60 card-glow overflow-hidden">
        <div className="px-6 py-4 border-b border-violet-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-violet-600" />
            <h2 className="text-[15px] font-bold text-gray-800">Departures — Next 14 Days</h2>
            {upcomingDepartures.length > 0 && (
              <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                {upcomingDepartures.length}
              </span>
            )}
          </div>
          <Link href="/bookings?status=CONFIRMED" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            All bookings →
          </Link>
        </div>

        {upcomingDepartures.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Plane className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No confirmed departures in the next 14 days</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-violet-50/40 border-b border-violet-100/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-2.5">Booking</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-2.5">Traveler</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-2.5">Trip</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-2.5">Pax</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-2.5">Departure</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-2.5">Status</th>
                  <th className="px-6 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-50/60">
                {upcomingDepartures.map((booking) => {
                  const days = differenceInDays(new Date(booking.startDate), new Date());
                  const isUrgent = days <= 2;
                  return (
                    <tr key={booking.id} className={`hover:bg-violet-50/40 transition-colors ${isUrgent ? "bg-red-50/30" : ""}`}>
                      <td className="px-6 py-3">
                        <Link href={`/bookings/${booking.id}`} className="text-sm font-bold text-violet-600 hover:text-violet-700">
                          {booking.bookingRef.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        {booking.contact ? (
                          <div>
                            <Link href={`/contacts/${booking.contact.id}`} className="text-sm font-medium text-gray-900 hover:text-violet-600">
                              {booking.contact.firstName} {booking.contact.lastName}
                            </Link>
                            {booking.contact.phone && (
                              <p className="text-xs text-gray-400">{booking.contact.phone}</p>
                            )}
                          </div>
                        ) : <span className="text-sm text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-gray-600">{booking.package?.name ?? "Custom Trip"}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-gray-600">{booking.passengers.length} pax</span>
                      </td>
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{format(new Date(booking.startDate), "EEE, MMM d")}</p>
                          <DaysUntilBadge date={booking.startDate} />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/bookings/${booking.id}`} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── REVENUE + PAYMENT ALERTS ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-violet-100/60 p-6 card-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">Revenue — Last 12 Months</h2>
              <p className="text-sm text-gray-400">Confirmed + Completed bookings</p>
            </div>
          </div>
          <RevenueChart data={revenueData} />
        </div>

        {/* Payment Alerts */}
        <div className="bg-white rounded-2xl border border-violet-100/60 card-glow overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-gray-800">Payments Due</h2>
            </div>
            <Link href="/bookings?paymentStatus=PARTIAL" className="text-xs text-violet-600 hover:text-violet-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-violet-50/60">
            {paymentAlerts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="w-7 h-7 text-green-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-400">No outstanding payments</p>
              </div>
            ) : (
              paymentAlerts.slice(0, 6).map((booking) => {
                const balance = booking.totalAmount - booking.paidAmount;
                const daysToDepart = differenceInDays(new Date(booking.startDate), new Date());
                const isUrgent = daysToDepart <= 7;
                return (
                  <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50/40 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUrgent ? "bg-red-500" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {booking.contact?.firstName} {booking.contact?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {daysToDepart <= 0 ? "Departed" : `Departs in ${daysToDepart}d`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${isUrgent ? "text-red-600" : "text-amber-600"}`}>
                        {formatCurrency(balance, settings.currency)}
                      </p>
                      <p className="text-xs text-gray-400">due</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── TASKS + AGENTS + PENDING ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tasks Due Today */}
        <div className="bg-white rounded-2xl border border-violet-100/60 card-glow overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-gray-800">Today&apos;s Follow-ups</h2>
              {tasksDueToday.length > 0 && (
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full">
                  {tasksDueToday.length}
                </span>
              )}
            </div>
            <Link href="/tasks" className="text-xs text-violet-600 hover:text-violet-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-violet-50/60">
            {tasksDueToday.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="w-7 h-7 text-green-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-400">All caught up!</p>
              </div>
            ) : (
              tasksDueToday.slice(0, 5).map((task) => (
                <div key={task.id} className="px-5 py-3 hover:bg-violet-50/40">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center mt-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      {task.contact && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {task.contact.firstName} {task.contact.lastName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize flex-shrink-0">{task.type.replace(/_/g, " ").toLowerCase()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Bookings */}
        <div className="bg-white rounded-2xl border border-violet-100/60 card-glow overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-800">Awaiting Confirmation</h2>
              {pendingBookings.length > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  {pendingBookings.length}
                </span>
              )}
            </div>
            <Link href="/bookings?status=PENDING" className="text-xs text-violet-600 hover:text-violet-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-violet-50/60">
            {pendingBookings.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="w-7 h-7 text-green-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-400">No pending bookings</p>
              </div>
            ) : (
              pendingBookings.slice(0, 5).map((booking) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                    {booking.contact?.firstName?.[0] ?? "?"}{booking.contact?.lastName?.[0] ?? ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {booking.contact ? `${booking.contact.firstName} ${booking.contact.lastName}` : "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {booking.package?.name ?? "Custom Trip"} · {format(new Date(booking.startDate), "MMM d")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount, settings.currency)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-white rounded-2xl border border-violet-100/60 card-glow overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-50">
            <h2 className="text-sm font-bold text-gray-800">Top Agents This Month</h2>
          </div>
          <div className="divide-y divide-violet-50/60">
            {topAgents.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No agent data yet</div>
            ) : (
              topAgents.slice(0, 5).map((agent, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={agent.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-base w-6 text-center">{medals[i] ?? `${i + 1}`}</span>
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                      {agent.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.bookingCount} booking{agent.bookingCount !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(agent.revenue, settings.currency, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
