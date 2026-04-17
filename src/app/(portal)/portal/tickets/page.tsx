import { getPortalTickets } from "@/lib/actions/portal"
import { format } from "date-fns"
import Link from "next/link"
import { LifeBuoy, Plus, ArrowRight } from "lucide-react"

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  PENDING_CUSTOMER: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
}

export default async function PortalTicketsPage() {
  const tickets = await getPortalTickets()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-500 text-sm">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link
          href="/portal/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold mb-2">No support tickets</p>
          <p className="text-gray-400 text-sm mb-6">Need help? Raise a ticket and we&apos;ll get back to you promptly.</p>
          <Link
            href="/portal/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Raise a Ticket
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {tickets.map((ticket, idx) => (
            <Link
              key={ticket.id}
              href={`/portal/tickets/${ticket.id}`}
              className={`block px-6 py-4 hover:bg-gray-50 transition-colors ${idx > 0 ? "border-t border-gray-100" : ""}`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TICKET_STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-600"}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{ticket.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ticket.category.replace("_", " ")} · {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
