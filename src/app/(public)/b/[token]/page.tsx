import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { format, differenceInMonths } from "date-fns";
import {
  Calendar, MapPin, Users, CreditCard, FileText, Download,
  CheckCircle2, AlertTriangle, Clock, Plane, Hotel, Zap, Car,
  Utensils, Sunrise, Tag,
} from "lucide-react";
import Image from "next/image";

interface PublicBookingWalletProps {
  params: Promise<{ token: string }>;
}

async function getBookingByShareToken(token: string) {
  return db.booking.findUnique({
    where: { shareToken: token },
    include: {
      contact: true,
      package: { select: { id: true, name: true } },
      deal: {
        include: {
          itineraries: {
            where: { status: { in: ["APPROVED", "BOOKED"] } },
            include: {
              days: {
                include: { items: { orderBy: { order: "asc" } } },
                orderBy: { dayNumber: "asc" },
              },
            },
            take: 1,
          },
        },
      },
      agent: { select: { id: true, name: true, email: true } },
      passengers: { orderBy: { type: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
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

const ITEM_TYPE_COLORS: Record<string, string> = {
  FLIGHT: "text-blue-600 bg-blue-50",
  HOTEL: "text-purple-600 bg-purple-50",
  ACTIVITY: "text-orange-600 bg-orange-50",
  TRANSFER: "text-emerald-600 bg-emerald-50",
  MEAL: "text-red-600 bg-red-50",
  FREE_TIME: "text-yellow-600 bg-yellow-50",
  OTHER: "text-gray-600 bg-gray-50",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  REFUNDED: "bg-gray-100 text-gray-700",
  OVERDUE: "bg-orange-100 text-orange-700",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function PublicBookingWallet({ params }: PublicBookingWalletProps) {
  const { token } = await params;
  const booking = await getBookingByShareToken(token);
  if (!booking) notFound();

  const balanceDue = booking.totalAmount - booking.paidAmount;
  const itinerary = booking.deal?.itineraries?.[0] ?? null;
  const travelerName = booking.contact
    ? `${booking.contact.firstName} ${booking.contact.lastName}`
    : "Valued Traveler";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0b1437 0%, #1e3a8a 50%, #312e81 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)" }}
        />
        <div className="relative max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-xl px-4 py-2 inline-flex items-center">
              <Image src="/Zenotrip-logo.jpg" alt="ZenoTrip" width={120} height={40} className="object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{travelerName}</h1>
          {booking.package && <p className="text-indigo-200 text-sm">{booking.package.name}</p>}
          {booking.destinations.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
              <MapPin className="w-4 h-4 text-indigo-300" />
              <span className="text-indigo-100 text-sm">{booking.destinations.join(" → ")}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Calendar className="w-4 h-4 text-indigo-300" />
            <span className="text-indigo-200 text-sm">
              {format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${BOOKING_STATUS_STYLES[booking.status]}`}>
              {booking.status}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${PAYMENT_STATUS_STYLES[booking.paymentStatus]}`}>
              {booking.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Payment Summary
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Package Price</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(booking.totalAmount, booking.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount Paid</span>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(booking.paidAmount, booking.currency)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Balance Due</span>
              <span className={`text-base font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(balanceDue, booking.currency)}
              </span>
            </div>
          </div>
          {booking.payments.length > 0 && (
            <div className="border-t border-gray-50 px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment History</p>
              <div className="space-y-2">
                {booking.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs text-gray-600">{payment.method.replace(/_/g, " ")}</span>
                      {payment.paidAt && (
                        <span className="text-xs text-gray-400">{format(new Date(payment.paidAt), "MMM d, yyyy")}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(payment.amount, booking.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Itinerary */}
        {itinerary && itinerary.days.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Your Journey
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {itinerary.days.map((day) => (
                <div key={day.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {day.dayNumber}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{day.title ?? `Day ${day.dayNumber}`}</h3>
                      <div className="flex items-center gap-3 flex-wrap mt-0.5">
                        {day.location && (
                          <span className="text-xs text-indigo-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {day.location}
                          </span>
                        )}
                        {day.date && (
                          <span className="text-xs text-gray-400">{format(new Date(day.date), "EEE, MMM d")}</span>
                        )}
                      </div>
                      {day.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{day.description}</p>
                      )}
                    </div>
                  </div>
                  {day.items.filter((i) => i.isIncluded).length > 0 && (
                    <div className="space-y-1.5 ml-11">
                      {day.items.filter((i) => i.isIncluded).map((item) => {
                        const Icon = ITEM_TYPE_ICONS[item.type] ?? Tag;
                        const colorCls = ITEM_TYPE_COLORS[item.type] ?? "text-gray-600 bg-gray-50";
                        return (
                          <div key={item.id} className="flex items-start gap-2">
                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${colorCls}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-800">{item.title}</p>
                              {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                              {item.location && <p className="text-xs text-gray-400">📍 {item.location}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passengers */}
        {booking.passengers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Travelers ({booking.passengers.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {booking.passengers.map((passenger) => {
                const expiryMonths = passenger.passportExpiry
                  ? differenceInMonths(new Date(passenger.passportExpiry), new Date())
                  : null;
                const isExpiryWarning = expiryMonths !== null && expiryMonths < 6;
                return (
                  <div key={passenger.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {passenger.firstName[0]}{passenger.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {passenger.firstName} {passenger.lastName}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{passenger.type.toLowerCase()}</p>
                    </div>
                    {passenger.passportExpiry && (
                      <div className={`flex items-center gap-1 text-xs ${isExpiryWarning ? "text-orange-600" : "text-gray-400"}`}>
                        {isExpiryWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>Passport exp. {format(new Date(passenger.passportExpiry), "MMM yyyy")}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents */}
        {booking.documents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Documents
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {booking.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.type}</p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Trip Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Check-in</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{format(new Date(booking.startDate), "MMM d, yyyy")}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Check-out</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{format(new Date(booking.endDate), "MMM d, yyyy")}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Travelers</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {booking.adults}A{booking.children > 0 ? ` · ${booking.children}C` : ""}{booking.infants > 0 ? ` · ${booking.infants}I` : ""}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86400000)} nights
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 space-y-1">
          <p className="text-sm font-semibold text-gray-700">{booking.agent?.name ?? "Your Travel Agent"}</p>
          {booking.agent?.email && <p className="text-xs text-gray-400">{booking.agent.email}</p>}
          <p className="text-xs text-gray-300 mt-3">Powered by ZenoTrip</p>
        </div>
      </div>
    </div>
  );
}
