import { getVisaApplications, getVisaStats, getAgentsForVisa } from "@/lib/actions/visa";
import { VISA_STAGE_COLORS, VISA_TYPE_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { Stamp, AlertTriangle, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { NewVisaDialog } from "@/components/visa/new-visa-dialog";
import { NavSelect } from "@/components/ui/nav-select";

export const metadata = { title: "Visa Tracker" };

interface PageProps {
  searchParams: Promise<{
    search?: string;
    stage?: string;
    visaType?: string;
    priority?: string;
    agentId?: string;
    page?: string;
  }>;
}

function DaysToTravel({ date }: { date: Date | null }) {
  if (!date) return <span className="text-xs text-gray-400">No date set</span>;
  const days = differenceInDays(new Date(date), new Date());
  if (days < 0) return <span className="text-xs text-gray-400">Passed</span>;
  const color = days <= 7 ? "text-red-600 font-bold" : days <= 21 ? "text-amber-600 font-semibold" : "text-gray-500";
  return (
    <div>
      <p className="text-xs font-medium text-gray-700">{format(new Date(date), "dd MMM yyyy")}</p>
      <p className={`text-xs ${color}`}>{days === 0 ? "TODAY" : `${days}d remaining`}</p>
    </div>
  );
}

function DocProgress({ total, received }: { total: number; received: number }) {
  const pct = total > 0 ? Math.round((received / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{received}/{total} docs</span>
        <span className="text-xs font-medium text-gray-700">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function VisaPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");

  const [{ applications, total, totalPages }, stats, contacts, agents] = await Promise.all([
    getVisaApplications({
      search: params.search,
      stage: params.stage,
      visaType: params.visaType,
      priority: params.priority,
      agentId: params.agentId,
      page,
      limit: 25,
    }),
    getVisaStats(),
    db.contact.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
      take: 300,
    }),
    getAgentsForVisa(),
  ]);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      search: params.search,
      stage: params.stage,
      visaType: params.visaType,
      priority: params.priority,
      agentId: params.agentId,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/visa?${p.toString()}`;
  }

  const statCards = [
    { label: "Total Applications", value: stats.total, icon: Stamp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Urgent", value: stats.urgent, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const stageFilters = [
    { id: "", label: "All" },
    { id: "INITIATED", label: "Initiated" },
    { id: "DOCUMENTS_PENDING", label: "Docs Pending" },
    { id: "DOCUMENTS_RECEIVED", label: "Docs Received" },
    { id: "SUBMITTED", label: "Submitted" },
    { id: "PROCESSING", label: "Processing" },
    { id: "APPOINTMENT_BOOKED", label: "Appt Booked" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visa Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} application{total !== 1 ? "s" : ""}</p>
        </div>
        <NewVisaDialog contacts={contacts} agents={agents} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pipeline mini-overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pipeline Overview</p>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {[
            { key: "INITIATED", label: "Initiated" },
            { key: "DOCUMENTS_PENDING", label: "Docs Pending" },
            { key: "DOCUMENTS_RECEIVED", label: "Docs Ready" },
            { key: "SUBMITTED", label: "Submitted" },
            { key: "PROCESSING", label: "Processing" },
            { key: "APPOINTMENT_BOOKED", label: "Appt Booked" },
            { key: "APPROVED", label: "Approved" },
          ].map(({ key, label }) => (
            <Link key={key} href={buildUrl({ stage: key, page: undefined })} className="text-center group">
              <div className={`text-lg font-bold ${params.stage === key ? "text-indigo-600" : "text-gray-800"}`}>
                {stats.byStage[key] ?? 0}
              </div>
              <div className={`text-[10px] leading-tight mt-0.5 ${params.stage === key ? "text-indigo-500 font-semibold" : "text-gray-400"}`}>
                {label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Stage tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {stageFilters.map((f) => (
            <Link
              key={f.id}
              href={buildUrl({ stage: f.id || undefined, page: undefined })}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                (params.stage ?? "") === f.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 flex-wrap">
          <form method="GET" action="/visa" className="flex items-center gap-2 flex-1 min-w-[200px]">
            {params.stage && <input type="hidden" name="stage" value={params.stage} />}
            {params.visaType && <input type="hidden" name="visaType" value={params.visaType} />}
            {params.priority && <input type="hidden" name="priority" value={params.priority} />}
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Search by name, destination, ref..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">Search</button>
          </form>

          <NavSelect
            value={buildUrl({ visaType: params.visaType })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            options={[
              { label: "All Visa Types", href: buildUrl({ visaType: undefined }) },
              ...Object.entries(VISA_TYPE_LABELS).map(([k, v]) => ({
                label: v,
                href: buildUrl({ visaType: k }),
              })),
            ]}
          />

          <NavSelect
            value={buildUrl({ priority: params.priority })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            options={[
              { label: "All Priority", href: buildUrl({ priority: undefined }) },
              { label: "Urgent", href: buildUrl({ priority: "URGENT" }) },
              { label: "High", href: buildUrl({ priority: "HIGH" }) },
              { label: "Medium", href: buildUrl({ priority: "MEDIUM" }) },
              { label: "Low", href: buildUrl({ priority: "LOW" }) },
            ]}
          />
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Applicant</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Visa</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Stage</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Documents</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Travel Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Appointment</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Alerts Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Stamp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-3">No visa applications found</p>
                    <NewVisaDialog contacts={contacts} agents={agents} />
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const received = app.documents.filter(
                    (d) => d.status === "RECEIVED" || d.status === "VERIFIED"
                  ).length;
                  const isUrgent = app.priority === "URGENT";

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-gray-50 transition-colors ${isUrgent ? "border-l-2 border-l-red-400" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/visa/${app.id}`} className="group">
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600">
                            {app.contact.firstName} {app.contact.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{app.contact.email}</p>
                          {app.booking && (
                            <p className="text-xs text-indigo-500 mt-0.5">
                              Booking: {app.booking.bookingRef.slice(0, 8).toUpperCase()}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-800">
                          {VISA_TYPE_LABELS[app.visaType] ?? app.visaType}
                        </p>
                        <p className="text-xs text-gray-400">{app.destinationCountry}</p>
                        {app.embassyCenter && (
                          <p className="text-xs text-gray-400">{app.embassyCenter}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VISA_STAGE_COLORS[app.stage] ?? "bg-gray-100 text-gray-700"}`}>
                          {app.stage.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 min-w-[120px]">
                        <DocProgress total={app.documents.length} received={received} />
                      </td>
                      <td className="px-5 py-3.5">
                        <DaysToTravel date={app.travelDate} />
                      </td>
                      <td className="px-5 py-3.5">
                        {app.appointmentDate ? (
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {format(new Date(app.appointmentDate), "dd MMM yyyy")}
                            </p>
                            {app.appointmentTime && (
                              <p className="text-xs text-gray-400">{app.appointmentTime}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not booked</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[app.priority] ?? ""}`}>
                          {app.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{app.alertSentCount}</span>
                        </div>
                        {app.lastReminderAt && (
                          <p className="text-xs text-gray-400">
                            {format(new Date(app.lastReminderAt), "dd MMM")}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Previous</Link>
              )}
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
