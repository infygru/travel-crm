import { getPortalBookings } from "@/lib/actions/portal"
import { format } from "date-fns"
import Link from "next/link"
import { CalendarCheck, ArrowRight, Clock, Users } from "lucide-react"

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  REFUNDED: "bg-gray-100 text-gray-700",
  OVERDUE: "bg-orange-100 text-orange-700",
}

export default async function PortalBookingsPage() {
  const bookings = await getPortalBookings()

  const now = new Date()
  const upcoming = bookings.filter((b) => new Date(b.startDate) >= now)
  const past = bookings.filter((b) => new Date(b.endDate) < now)

  const renderBookingCard = (booking: (typeof bookings)[0]) => (
    <Link
      key={booking.id}
      href={`/portal/bookings/${booking.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all"
    >
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BOOKING_STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-700"}`}>
              {booking.status}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[booking.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
              {booking.paymentStatus}
            </span>
            <span className="text-xs text-gray-400 font-mono">{booking.bookingRef}</span>
          </div>
          <p className="font-bold text-gray-900 text-base">
            {booking.package?.name ?? booking.destinations.join(", ") ?? "Travel Booking"}
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {booking.adults} adult{booking.adults > 1 ? "s" : ""}
              {booking.children > 0 ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}
            </span>
          </div>
          {booking.agent && (
            <p className="text-xs text-gray-400 mt-1">Agent: {booking.agent.name}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-gray-900">
            {booking.currency} {booking.totalAmount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Paid: {booking.currency} {booking.paidAmount.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 justify-end mt-2 text-indigo-600 text-xs font-semibold">
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 text-sm">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold mb-2">No bookings found</p>
          <p className="text-gray-400 text-sm">Contact your travel agent to make a booking.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Upcoming Trips ({upcoming.length})
              </h2>
              <div className="space-y-3">{upcoming.map(renderBookingCard)}</div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Past Trips ({past.length})
              </h2>
              <div className="space-y-3">{past.map(renderBookingCard)}</div>
            </div>
          )}

          {/* In progress / confirmed not in upcoming or past */}
          {bookings.filter((b) => !upcoming.includes(b) && !past.includes(b)).length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Active
              </h2>
              <div className="space-y-3">
                {bookings.filter((b) => !upcoming.includes(b) && !past.includes(b)).map(renderBookingCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
