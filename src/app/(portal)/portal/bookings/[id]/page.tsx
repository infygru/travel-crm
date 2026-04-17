import { getPortalBooking } from "@/lib/actions/portal"
import { format } from "date-fns"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Users, DollarSign, FileText, LifeBuoy } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

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

export default async function PortalBookingDetailPage({ params }: Props) {
  const { id } = await params
  const booking = await getPortalBooking(id)

  if (!booking) notFound()

  const outstanding = booking.totalAmount - booking.paidAmount

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/portal/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BOOKING_STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-700"}`}>
                {booking.status}
              </span>
              <span className="text-sm text-gray-400 font-mono">{booking.bookingRef}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {booking.package?.name ?? booking.destinations.join(", ") ?? "Travel Booking"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {format(new Date(booking.startDate), "MMMM d")} – {format(new Date(booking.endDate), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{booking.currency} {booking.totalAmount.toLocaleString()}</p>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[booking.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
              {booking.paymentStatus}
            </span>
          </div>
        </div>

        {booking.package?.description && (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
            {booking.package.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Passengers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="font-bold text-gray-900">Passengers</h2>
          </div>
          {booking.passengers.length === 0 ? (
            <p className="text-sm text-gray-400">No passenger details added yet.</p>
          ) : (
            <div className="space-y-2">
              {booking.passengers.map((pax, idx) => (
                <div key={pax.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{pax.firstName} {pax.lastName}</p>
                    <p className="text-xs text-gray-400 capitalize">{pax.type.toLowerCase()} · {pax.nationality ?? "—"}</p>
                  </div>
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="font-bold text-gray-900">Payment Summary</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-gray-900">{booking.currency} {booking.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-bold text-emerald-600">{booking.currency} {booking.paidAmount.toLocaleString()}</span>
            </div>
            {outstanding > 0 && (
              <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-gray-700 font-semibold">Outstanding</span>
                <span className="font-bold text-red-600">{booking.currency} {outstanding.toLocaleString()}</span>
              </div>
            )}
            {outstanding <= 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-sm text-emerald-700 font-semibold text-center mt-2">
                ✓ Fully Paid
              </div>
            )}
          </div>

          {/* Payment history */}
          {booking.payments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment History</p>
              <div className="space-y-2">
                {booking.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{payment.method} · {payment.paidAt ? format(new Date(payment.paidAt), "MMM d, yyyy") : "Pending"}</span>
                    <span className="font-semibold text-gray-800">{payment.currency} {payment.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      {booking.documents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <h2 className="font-bold text-gray-900">Documents</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {booking.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
              >
                <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.type}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Raise a Ticket */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <LifeBuoy className="w-4.5 h-4.5 text-indigo-600" style={{ width: "1.1rem", height: "1.1rem" }} />
          </div>
          <h3 className="font-bold text-indigo-900">Need Help With This Booking?</h3>
        </div>
        <p className="text-sm text-indigo-700 mb-4">
          If you have any questions or issues with this booking, our support team is here to help.
        </p>
        <Link
          href={`/portal/tickets/new?bookingId=${booking.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <LifeBuoy className="w-4 h-4" />
          Raise a Support Ticket
        </Link>
      </div>
    </div>
  )
}
