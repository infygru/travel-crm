import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getRevenueByMonth,
  getBookingsByStatus,
  getTopAgents,
  getLeadSourceBreakdown,
  getDashboardStats,
} from "@/lib/actions/dashboard";
import { getLeadAnalytics } from "@/lib/actions/leads";
import { BarRevenueChart } from "@/components/charts/bar-revenue-chart";
import { BookingsPieChart } from "@/components/charts/bookings-pie-chart";
import { BarChart3, TrendingUp, TrendingDown, Users, Globe, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { getCompanySettings } from "@/lib/actions/settings";

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return current > 0 ? (
      <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
        <TrendingUp className="w-3 h-3" /> New
      </span>
    ) : null;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return (
    <span className="text-xs text-gray-500 font-medium flex items-center gap-0.5">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
  if (pct > 0) return (
    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
      <TrendingUp className="w-3 h-3" /> +{pct}%
    </span>
  );
  return (
    <span className="text-xs text-red-500 font-medium flex items-center gap-0.5">
      <TrendingDown className="w-3 h-3" /> {pct}%
    </span>
  );
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [revenueData, bookingsByStatus, topAgents, leadSources, dashStats, leadAnalytics, settings] = await Promise.all([
    getRevenueByMonth(),
    getBookingsByStatus(),
    getTopAgents(10),
    getLeadSourceBreakdown(),
    getDashboardStats(),
    getLeadAnalytics(),
    getCompanySettings(),
  ]);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalBookings = bookingsByStatus.reduce((sum, b) => sum + b.count, 0);

  // Current month vs prior month for revenue
  const currentMonth = revenueData[revenueData.length - 1]?.revenue ?? 0;
  const priorMonth = revenueData[revenueData.length - 2]?.revenue ?? 0;

  // Current vs prev for leads (from dashStats)
  const newLeadsCurrent = dashStats.newLeads;
  const newLeadsPrev = dashStats.prevNewLeads;

  // Booking trend
  const bookingCurrent = dashStats.activeBookings;
  const bookingPrev = dashStats.prevActiveBookings;

  const SUMMARY_STATS = [
    {
      label: "Annual Revenue",
      value: formatCurrency(totalRevenue, settings.currency, { maximumFractionDigits: 0 }),
      current: currentMonth,
      previous: priorMonth,
      note: "vs prior month",
    },
    {
      label: "Total Bookings",
      value: totalBookings.toString(),
      current: bookingCurrent,
      previous: bookingPrev,
      note: "active vs prior period",
    },
    {
      label: "New Leads (30d)",
      value: newLeadsCurrent.toString(),
      current: newLeadsCurrent,
      previous: newLeadsPrev,
      note: "vs prior 30 days",
    },
    {
      label: "Conversion Rate",
      value: `${Math.round(dashStats.conversionRate)}%`,
      current: dashStats.conversionRate,
      previous: 0,
      note: "deal win rate",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Business intelligence and performance metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SUMMARY_STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            <div className="mt-1.5 flex items-center gap-1">
              <TrendBadge current={stat.current} previous={stat.previous} />
              <span className="text-xs text-gray-400">{stat.note}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue by Month */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Revenue by Month (12 months)</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(totalRevenue, settings.currency, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
        </div>
        <BarRevenueChart data={revenueData} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Bookings by Status</h2>
          </div>
          <BookingsPieChart data={bookingsByStatus} />
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Lead Source Breakdown</h2>
          </div>
          {leadSources.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">No data yet</div>
          ) : (
            <div className="space-y-3">
              {leadSources
                .sort((a, b) => b.count - a.count)
                .map((source) => {
                  const maxCount = Math.max(...leadSources.map((s) => s.count));
                  const pct = (source.count / maxCount) * 100;
                  const totalLeads = leadSources.reduce((sum, s) => sum + s.count, 0);
                  const sharePct = Math.round((source.count / totalLeads) * 100);
                  return (
                    <div key={source.source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{source.source.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{sharePct}%</span>
                          <span className="text-sm font-semibold text-gray-900">{source.count}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Lead Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900">Lead Pipeline Status</h2>
          <span className="ml-auto text-xs text-gray-400">
            {leadAnalytics.totalContacts} total · {leadAnalytics.conversionRate}% conversion
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {leadAnalytics.byStatus.map((s) => {
            const pct = leadAnalytics.totalContacts > 0
              ? Math.round((s._count / leadAnalytics.totalContacts) * 100)
              : 0;
            const STATUS_COLORS: Record<string, string> = {
              NEW: "bg-blue-100 text-blue-700",
              CONTACTED: "bg-purple-100 text-purple-700",
              QUALIFIED: "bg-indigo-100 text-indigo-700",
              PROPOSAL_SENT: "bg-yellow-100 text-yellow-700",
              NEGOTIATION: "bg-orange-100 text-orange-700",
              CONVERTED: "bg-green-100 text-green-700",
              LOST: "bg-red-100 text-red-700",
            };
            return (
              <div key={s.leadStatus} className={`rounded-xl p-3 text-center ${STATUS_COLORS[s.leadStatus ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
                <p className="text-xl font-bold">{s._count}</p>
                <p className="text-xs font-medium mt-0.5">{(s.leadStatus ?? "").replace(/_/g, " ")}</p>
                <p className="text-xs opacity-70 mt-0.5">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900">Agent Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Rank</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Agent</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Bookings</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Deals</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topAgents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No agent data yet</td>
                </tr>
              ) : (
                topAgents.map((agent, i) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-400"}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                          {agent.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-700">{agent.bookingCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-700">{agent.dealCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(agent.revenue, settings.currency, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
