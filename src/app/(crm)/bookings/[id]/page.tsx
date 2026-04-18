import { getBookingById } from "@/lib/actions/bookings";
import { getCompanySettings } from "@/lib/actions/settings";
import { formatCurrency } from "@/lib/currency";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  FileText,
  CreditCard,
  User,
  Package,
  Download,
} from "lucide-react";
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/constants";
import {
  BookingStatusActions,
  AddPaymentForm,
  EditBookingModal,
  AddPassengerForm,
  RemovePassengerButton,
  BookingNoteForm,
  SendConfirmationEmailButton,
} from "./booking-actions";
import { BulkPassengerEntry } from "@/components/bookings/bulk-passenger-entry";
import { PassengerCostBreakdown } from "@/components/bookings/passenger-cost-breakdown";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function BookingDetailPage({ params, searchParams }: BookingDetailPageProps) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const [booking, settings] = await Promise.all([
    getBookingById(id),
    getCompanySettings(),
  ]);
  if (!booking) notFound();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "passengers", label: `Passengers (${booking.passengers.length})` },
    { id: "payments", label: `Payments (${booking.payments.length})` },
    { id: "documents", label: `Documents (${booking.documents.length})` },
    { id: "notes", label: `Notes (${booking.notes.length})` },
    { id: "timeline", label: "Timeline" },
  ];

  const balanceDue = booking.totalAmount - booking.paidAmount;
  const costPrice = (booking as { costPrice?: number }).costPrice ?? 0;
  const profit = booking.totalAmount - costPrice;
  const margin = booking.totalAmount > 0 ? Math.round((profit / booking.totalAmount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/bookings" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                {booking.bookingRef.slice(0, 8).toUpperCase()}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${BOOKING_STATUS_COLORS[booking.status]}`}>
                {booking.status}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${PAYMENT_STATUS_COLORS[booking.paymentStatus]}`}>
                {booking.paymentStatus}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Created {format(new Date(booking.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(booking.totalAmount, settings.currency)}</p>
            <p className="text-sm text-gray-500">{settings.currency}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 flex-wrap">
          <BookingStatusActions
            bookingId={id}
            currentStatus={booking.status}
            totalAmount={booking.totalAmount}
            paidAmount={booking.paidAmount}
            currency={booking.currency}
          />
          <EditBookingModal
            bookingId={id}
            booking={{
              startDate: format(new Date(booking.startDate), "yyyy-MM-dd"),
              endDate: format(new Date(booking.endDate), "yyyy-MM-dd"),
              adults: booking.adults,
              children: booking.children,
              infants: booking.infants,
              totalAmount: booking.totalAmount,
              costPrice,
              currency: booking.currency,
              destinations: booking.destinations,
              specialRequests: booking.specialRequests,
              internalNotes: booking.internalNotes,
            }}
          />
          {booking.status !== "CANCELLED" && (
            <AddPaymentForm
              bookingId={id}
              currency={booking.currency}
              balanceDue={balanceDue}
            />
          )}
          {booking.contact?.email && (
            <SendConfirmationEmailButton
              bookingId={id}
              contactEmail={booking.contact.email}
            />
          )}
          <a
            href={`/api/pdf/booking/${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Invoice PDF
          </a>
          <a
            href={`/api/export/manifest/${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Manifest CSV
          </a>
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Dates</p>
              <p className="text-sm font-medium text-gray-700">
                {format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Travelers</p>
              <p className="text-sm font-medium text-gray-700">
                {booking.adults}A {booking.children > 0 ? `· ${booking.children}C` : ""} {booking.infants > 0 ? `· ${booking.infants}I` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Package</p>
              <p className="text-sm font-medium text-gray-700">{booking.package?.name ?? "Custom"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Agent</p>
              <p className="text-sm font-medium text-gray-700">{booking.agent?.name ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Selling Price</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(booking.totalAmount, settings.currency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Amount Paid</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(booking.paidAmount, settings.currency)}</p>
          {balanceDue > 0 && <p className="text-xs text-red-500 mt-0.5">Balance: {formatCurrency(balanceDue, settings.currency)}</p>}
        </div>
        <div className={`bg-white rounded-xl border p-4 shadow-sm ${profit > 0 ? "border-emerald-200" : costPrice > 0 ? "border-red-200" : "border-gray-200"}`}>
          <p className="text-xs text-gray-500">Gross Profit</p>
          <p className={`text-xl font-bold mt-1 ${profit > 0 ? "text-emerald-600" : costPrice > 0 ? "text-red-600" : "text-gray-400"}`}>
            {costPrice > 0 ? formatCurrency(profit, settings.currency) : "—"}
          </p>
          {costPrice > 0 && <p className="text-xs text-gray-400 mt-0.5">Cost: {formatCurrency(costPrice, settings.currency)}</p>}
        </div>
        <div className={`bg-white rounded-xl border p-4 shadow-sm ${margin >= 20 ? "border-emerald-200" : costPrice > 0 ? "border-amber-200" : "border-gray-200"}`}>
          <p className="text-xs text-gray-500">Margin</p>
          <p className={`text-xl font-bold mt-1 ${margin >= 20 ? "text-emerald-600" : costPrice > 0 ? "text-amber-600" : "text-gray-400"}`}>
            {costPrice > 0 ? `${margin}%` : "—"}
          </p>
          {costPrice > 0 && <p className="text-xs text-gray-400 mt-0.5">on selling price</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/bookings/${id}?tab=${t.id}`}
                className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                {booking.contact ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Link href={`/contacts/${booking.contact.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                      {booking.contact.firstName} {booking.contact.lastName}
                    </Link>
                    {booking.contact.email && <p className="text-sm text-gray-600 mt-1">{booking.contact.email}</p>}
                    {booking.contact.phone && <p className="text-sm text-gray-600">{booking.contact.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No contact linked</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Destinations</h3>
                <div className="flex flex-wrap gap-2">
                  {booking.destinations.length > 0 ? (
                    booking.destinations.map((dest) => (
                      <span key={dest} className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {dest}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No destinations specified</p>
                  )}
                </div>
              </div>
              {booking.deal && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Linked Deal</h3>
                  <Link href={`/deals/${booking.deal.id}`} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">{booking.deal.title}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(booking.deal.value, settings.currency)}</p>
                    </div>
                  </Link>
                </div>
              )}
              {booking.specialRequests && (
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Special Requests</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">{booking.specialRequests}</p>
                </div>
              )}
              {booking.internalNotes && (
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Internal Notes</h3>
                  <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-4">{booking.internalNotes}</p>
                </div>
              )}
            </div>
          )}

          {tab === "passengers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Passengers</h3>
                <AddPassengerForm bookingId={id} />
              </div>
              <BulkPassengerEntry bookingId={id} currency={booking.currency} />
              {booking.passengers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No passengers added yet. Click &quot;Add Passenger&quot; to get started.</p>
              ) : (
                booking.passengers.map((passenger) => (
                  <div key={passenger.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
                        {passenger.firstName[0]}{passenger.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {passenger.firstName} {passenger.lastName}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400 capitalize">{passenger.type.toLowerCase()}</span>
                          {passenger.nationality && <span className="text-xs text-gray-400">{passenger.nationality}</span>}
                          {passenger.gender && <span className="text-xs text-gray-400 capitalize">{passenger.gender.toLowerCase()}</span>}
                          {passenger.dateOfBirth && <span className="text-xs text-gray-400">DOB: {format(new Date(passenger.dateOfBirth), "MMM d, yyyy")}</span>}
                        </div>
                        {(passenger.seatPreference || passenger.mealPreference) && (
                          <div className="flex items-center gap-2 mt-1">
                            {passenger.seatPreference && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{passenger.seatPreference} seat</span>}
                            {passenger.mealPreference && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">{passenger.mealPreference.replace(/_/g, " ")}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {passenger.passportNumber && (
                          <p className="text-xs text-gray-400">Passport: {passenger.passportNumber}</p>
                        )}
                        {passenger.passportExpiry && (
                          <p className="text-xs text-gray-400">
                            Exp: {format(new Date(passenger.passportExpiry), "MMM yyyy")}
                          </p>
                        )}
                      </div>
                      <RemovePassengerButton
                        passengerId={passenger.id}
                        bookingId={id}
                        name={`${passenger.firstName} ${passenger.lastName}`}
                      />
                    </div>
                  </div>
                ))
              )}
              {booking.passengers.length > 0 && (
                <PassengerCostBreakdown
                  passengers={booking.passengers.map((p) => ({
                    id: p.id,
                    firstName: p.firstName,
                    lastName: p.lastName,
                    type: p.type,
                    individualCost: (p as { individualCost?: number }).individualCost ?? 0,
                  }))}
                  currency={booking.currency}
                  totalAmount={booking.totalAmount}
                />
              )}
            </div>
          )}

          {tab === "payments" && (
            <div className="space-y-3">
              {booking.payments.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No payments recorded yet</p>
              ) : (
                booking.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.method.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-400">
                          {payment.paidAt ? format(new Date(payment.paidAt), "MMM d, yyyy") : "Pending"}
                          {payment.reference && ` · Ref: ${payment.reference}`}
                        </p>
                        {payment.notes && <p className="text-xs text-gray-400 mt-0.5">{payment.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(payment.amount, settings.currency)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PAYMENT_STATUS_COLORS[payment.status]}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "documents" && (
            <div className="space-y-3">
              {booking.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No documents uploaded yet</p>
                </div>
              ) : (
                booking.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.type} · {format(new Date(doc.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <a href={doc.url} target="_blank" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              <BookingNoteForm bookingId={id} />
              {booking.notes.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No notes yet</p>
              ) : (
                booking.notes.map((note) => (
                  <div key={note.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {note.author?.name?.[0] ?? "?"}
                      </div>
                      <p className="text-xs font-medium text-gray-700">{note.author?.name}</p>
                      <p className="text-xs text-gray-400 ml-auto">{format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "timeline" && (
            <div className="space-y-3">
              {booking.activities.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No activity yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                  {booking.activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-start gap-4 pb-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center z-10 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(activity.createdAt), "MMM d, yyyy · h:mm a")}
                          {activity.user && ` · ${activity.user.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
