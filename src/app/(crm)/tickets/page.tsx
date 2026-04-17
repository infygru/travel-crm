import { getTickets, getTicketStats } from "@/lib/actions/tickets";
import { TICKET_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import Link from "next/link";
import { format } from "date-fns";
import {
  LifeBuoy,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { NavSelect } from "@/components/ui/nav-select";

interface TicketsPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: string;
  }>;
}

const TICKET_CATEGORY_LABELS: Record<string, string> = {
  BOOKING_ISSUE: "Booking Issue",
  REFUND_REQUEST: "Refund Request",
  COMPLAINT: "Complaint",
  GENERAL_INQUIRY: "General Inquiry",
  DOCUMENT_REQUEST: "Document Request",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  BOOKING_ISSUE: "bg-blue-100 text-blue-700",
  REFUND_REQUEST: "bg-red-100 text-red-700",
  COMPLAINT: "bg-orange-100 text-orange-700",
  GENERAL_INQUIRY: "bg-gray-100 text-gray-700",
  DOCUMENT_REQUEST: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-500",
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const sp = await searchParams;
  const status = sp.status;
  const priority = sp.priority;
  const category = sp.category;
  const search = sp.search;
  const page = Number(sp.page ?? 1);

  const [{ tickets, total, totalPages }, stats] = await Promise.all([
    getTickets({ status, priority, category, search, page, limit: 20 }),
    getTicketStats(),
  ]);

  const statuses = ["", "OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"];
  const statusLabels: Record<string, string> = {
    "": "All",
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    PENDING_CUSTOMER: "Pending",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status, priority, category, search, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/tickets?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-sm text-gray-500">{total} total tickets</p>
          </div>
        </div>
        <Link
          href="/tickets/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500">Open</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.openCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.inProgressCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-500">Resolved Today</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
        </div>
        <div className={`bg-white rounded-xl border p-4 shadow-sm ${stats.slaBreachCount > 0 ? "border-red-200" : "border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className={`w-4 h-4 ${stats.slaBreachCount > 0 ? "text-red-500" : "text-gray-400"}`} />
            <p className="text-xs text-gray-500">SLA Breaches</p>
          </div>
          <p className={`text-2xl font-bold ${stats.slaBreachCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {stats.slaBreachCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Status tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-4">
            {statuses.map((s) => (
              <Link
                key={s}
                href={buildUrl({ status: s || undefined, page: undefined })}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  (status ?? "") === s
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {statusLabels[s]}
              </Link>
            ))}
          </nav>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          <form method="GET" action="/tickets" className="flex items-center gap-2 flex-1 min-w-[200px]">
            {status && <input type="hidden" name="status" value={status} />}
            {priority && <input type="hidden" name="priority" value={priority} />}
            {category && <input type="hidden" name="category" value={category} />}
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search tickets..."
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200"
            >
              Search
            </button>
          </form>

          <NavSelect
            value={buildUrl({ priority: priority ?? undefined, page: undefined })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Priorities", href: buildUrl({ priority: undefined, page: undefined }) },
              { label: "Low", href: buildUrl({ priority: "LOW", page: undefined }) },
              { label: "Medium", href: buildUrl({ priority: "MEDIUM", page: undefined }) },
              { label: "High", href: buildUrl({ priority: "HIGH", page: undefined }) },
              { label: "Urgent", href: buildUrl({ priority: "URGENT", page: undefined }) },
            ]}
          />

          <NavSelect
            value={buildUrl({ category: category ?? undefined, page: undefined })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Categories", href: buildUrl({ category: undefined, page: undefined }) },
              ...Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => ({
                label: v,
                href: buildUrl({ category: k, page: undefined }),
              })),
            ]}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const slaIsNear = ticket.slaDeadline
                    ? new Date(ticket.slaDeadline).getTime() - Date.now() < 2 * 60 * 60 * 1000
                    : false;
                  const slaPast = ticket.slaDeadline
                    ? new Date(ticket.slaDeadline) < new Date()
                    : false;

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/tickets/${ticket.id}`} className="group">
                          <p className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</p>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {ticket.subject}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {ticket.contact ? (
                          <Link href={`/contacts/${ticket.contact.id}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                            {ticket.contact.firstName} {ticket.contact.lastName}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[ticket.category]}`}>
                          {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                          {ticket.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ticket.slaDeadline ? (
                          <span className={`text-xs font-medium ${slaPast ? "text-red-600" : slaIsNear ? "text-orange-600" : "text-gray-500"}`}>
                            {slaPast && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                            {format(new Date(ticket.slaDeadline), "MMM d, HH:mm")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                              {ticket.assignee.name?.[0] ?? "?"}
                            </div>
                            <span className="text-xs text-gray-600">{ticket.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {format(new Date(ticket.createdAt), "MMM d")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} · {total} tickets
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
