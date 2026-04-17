import { getBookings, getBookingStats } from "@/lib/actions/bookings";
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/constants";
import { differenceInDays, format, isPast } from "date-fns";
import Link from "next/link";
import { CalendarCheck, DollarSign, AlertTriangle, Plane, Plus } from "lucide-react";
import { NewBookingDialog } from "@/components/bookings/new-booking-dialog";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavSelect } from "@/components/ui/nav-select";

interface BookingsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    paymentStatus?: string;
    view?: string;
    page?: string;
  }>;
}

function DepartureCell({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const days = differenceInDays(new Date(startDate), new Date());
  const past = isPast(new Date(endDate));

  return (
    <div>
      <p className="text-xs font-medium text-gray-700">
        {format(new Date(startDate), "MMM d")} – {format(new Date(endDate), "MMM d, yyyy")}
      </p>
      {!past && days >= 0 && (
        <span className={`text-xs font-medium ${
          days === 0 ? "text-red-600 font-bold" :
          days <= 3 ? "text-red-500" :
          days <= 7 ? "text-orange-500" :
          days <= 14 ? "text-amber-500" :
          "text-gray-400"
        }`}>
          {days === 0 ? "DEPARTS TODAY" : `${days}d to departure`}
        </span>
      )}
      {past && <span className="text-xs text-gray-400">Completed trip</span>}
    </div>
  );
}

function BalanceCell({ total, paid, currency }: { total: number; paid: number; currency: string }) {
  const balance = total - paid;
  if (balance <= 0) {
    return (
      <div className="text-right">
        <p className="text-sm font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</p>
        <span className="text-xs text-green-600 font-medium">Fully paid</span>
      </div>
    );
  }
  return (
    <div className="text-right">
      <p className="text-sm font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</p>
      <p className="text-xs text-red-600 font-medium">₹{balance.toLocaleString("en-IN")} due</p>
    </div>
  );
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const view = params.view ?? "all";

  // Map view to filters
  const statusFilter = view === "upcoming" ? "CONFIRMED" :
                       view === "pending" ? "PENDING" :
                       view === "inprogress" ? "IN_PROGRESS" :
                       params.status;

  const [{ bookings, total, totalPages }, stats, contacts, packages] = await Promise.all([
    getBookings({
      search: params.search,
      status: statusFilter,
      paymentStatus: params.paymentStatus,
      page,
      limit: 25,
    }),
    getBookingStats(),
    db.contact.findMany({
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
      take: 200,
    }),
    db.travelPackage.findMany({
      where: { isActive: true },
      select: { id: true, name: true, basePrice: true, currency: true },
      orderBy: { name: "asc" },
    }),
  ]);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { search: params.search, status: params.status, paymentStatus: params.paymentStatus, view, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/bookings?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} booking{total !== 1 ? "s" : ""}</p>
        </div>
        <NewBookingDialog contacts={contacts} packages={packages} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50", href: "/bookings" },
          { label: "Confirmed", value: stats.confirmed, icon: Plane, color: "text-green-600", bg: "bg-green-50", href: "/bookings?status=CONFIRMED" },
          { label: "Pending", value: stats.pending, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", href: "/bookings?status=PENDING" },
          { label: "Revenue Collected", value: `₹${stats.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50", href: "/bookings?paymentStatus=PAID" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* View Tabs + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Quick view tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: "all", label: "All Bookings" },
            { id: "upcoming", label: "Upcoming Departures" },
            { id: "pending", label: "Pending Confirmation" },
            { id: "inprogress", label: "In Progress" },
          ].map((v) => (
            <Link
              key={v.id}
              href={buildUrl({ view: v.id, page: undefined })}
              className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                view === v.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 flex-wrap">
          <form method="GET" action="/bookings" className="flex items-center gap-2 flex-1 min-w-[200px]">
            {view && view !== "all" && <input type="hidden" name="view" value={view} />}
            {params.status && <input type="hidden" name="status" value={params.status} />}
            {params.paymentStatus && <input type="hidden" name="paymentStatus" value={params.paymentStatus} />}
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Search by reference or contact name..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">Search</button>
          </form>

          <NavSelect
            value={buildUrl({ paymentStatus: params.paymentStatus })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Payments", href: buildUrl({ paymentStatus: undefined }) },
              { label: "Unpaid", href: buildUrl({ paymentStatus: "UNPAID" }) },
              { label: "Partial", href: buildUrl({ paymentStatus: "PARTIAL" }) },
              { label: "Paid", href: buildUrl({ paymentStatus: "PAID" }) },
              { label: "Overdue", href: buildUrl({ paymentStatus: "OVERDUE" }) },
            ]}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Ref</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Traveler</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Package / Trip</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Departure</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Payment</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <CalendarCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-2">No bookings found</p>
                    <NewBookingDialog contacts={contacts} packages={packages} />
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const daysOut = differenceInDays(new Date(booking.startDate), new Date());
                  const balance = booking.totalAmount - booking.paidAmount;
                  const isUrgent = daysOut >= 0 && daysOut <= 3 && booking.status === "CONFIRMED";
                  const hasBalanceDue = balance > 0 && daysOut <= 14 && daysOut >= 0;

                  return (
                    <tr
                      key={booking.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isUrgent ? "border-l-2 border-l-red-400" :
                        hasBalanceDue ? "border-l-2 border-l-amber-400" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/bookings/${booking.id}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                          {booking.bookingRef.slice(0, 8).toUpperCase()}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(booking.createdAt), "MMM d, yyyy")}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {booking.contact ? (
                          <Link href={`/contacts/${booking.contact.id}`} className="flex items-center gap-2 group">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                              {booking.contact.firstName[0]}{booking.contact.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                                {booking.contact.firstName} {booking.contact.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {booking._count.passengers} pax
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">No contact</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-700">{booking.package?.name ?? "Custom Trip"}</span>
                        {booking.agent && (
                          <p className="text-xs text-gray-400 mt-0.5">by {booking.agent.name}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <DepartureCell startDate={booking.startDate} endDate={booking.endDate} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[booking.paymentStatus]}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <BalanceCell total={booking.totalAmount} paid={booking.paidAmount} currency={booking.currency} />
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
