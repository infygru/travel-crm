import { getPortalDashboardData } from "@/lib/actions/portal"
import { format } from "date-fns"
import Link from "next/link"
import {
  CalendarCheck,
  Map,
  LifeBuoy,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react"

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
}

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  PENDING_CUSTOMER: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
}

export default async function PortalDashboardPage() {
  const { contact, bookings, itineraries, tickets } = await getPortalDashboardData()

  const now = new Date()
  const upcomingBookings = bookings.filter((b) => new Date(b.startDate) >= now)
  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
  const nearestTrip = upcomingBookings[0]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl px-8 py-8 text-white shadow-lg shadow-indigo-200">
        <p className="text-indigo-200 text-sm font-medium mb-1">Good to see you again,</p>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {contact.firstName}! 👋</h1>
        <p className="text-indigo-200 text-sm">
          {upcomingBookings.length > 0
            ? `You have ${upcomingBookings.length} upcoming trip${upcomingBookings.length > 1 ? "s" : ""}. We can't wait for your adventure!`
            : "No upcoming trips yet. Contact your agent to start planning your next adventure!"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">Active Bookings</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <CalendarCheck className="w-4.5 h-4.5 text-blue-500" style={{ width: "1.1rem", height: "1.1rem" }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</p>
          <p className="text-xs text-gray-400 mt-1">{bookings.length} total bookings</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">Next Trip</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Map className="w-4.5 h-4.5 text-purple-500" style={{ width: "1.1rem", height: "1.1rem" }} />
            </div>
          </div>
          {nearestTrip ? (
            <>
              <p className="text-base font-bold text-gray-900 truncate">
                {nearestTrip.package?.name ?? nearestTrip.destinations[0] ?? "Upcoming"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(nearestTrip.startDate), "MMM d, yyyy")}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No upcoming trips</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">Open Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <LifeBuoy className="w-4.5 h-4.5 text-amber-500" style={{ width: "1.1rem", height: "1.1rem" }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{openTickets.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {openTickets.length === 0 ? "All issues resolved" : "Awaiting response"}
          </p>
        </div>
      </div>

      {/* Upcoming Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Your Upcoming Trips</h2>
          <Link href="/portal/bookings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No upcoming trips. Contact your travel agent to start planning!
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <Link
                key={booking.id}
                href={`/portal/bookings/${booking.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BOOKING_STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {booking.status}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{booking.bookingRef}</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      {booking.package?.name ?? booking.destinations.join(", ") ?? "Trip"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {booking.currency} {booking.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Itineraries */}
      {itineraries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your Itineraries</h2>
            <Link href="/portal/itineraries" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {itineraries.slice(0, 4).map((itin) => (
              <div key={itin.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-gray-900 text-sm flex-1">{itin.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${itin.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                    {itin.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{itin.days.length} days · {itin.currency} {itin.totalCost.toLocaleString()}</p>
                {itin.shareToken && (
                  <a
                    href={`/itinerary/${itin.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View &amp; Approve
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Support Tickets</h2>
          <div className="flex items-center gap-3">
            <Link href="/portal/tickets/new" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              New Ticket
            </Link>
            <Link href="/portal/tickets" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm font-medium">No support tickets</p>
            <p className="text-gray-400 text-xs mt-1">Great — all issues resolved!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.slice(0, 5).map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 px-5 py-3.5 hover:shadow-sm hover:border-indigo-200 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{ticket.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{ticket.ticketNumber}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TICKET_STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
