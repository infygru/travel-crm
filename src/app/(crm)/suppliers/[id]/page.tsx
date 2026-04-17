import { getSupplier } from "@/lib/actions/suppliers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  CreditCard,
  Plus,
} from "lucide-react";
import {
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_PAYMENT_STATUS_COLORS,
} from "@/lib/constants";
import { SupplierActions } from "@/components/suppliers/supplier-actions";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const totalPaid = supplier.payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const totalPending = supplier.payments
    .filter((p) => p.status === "PENDING" || p.status === "OVERDUE")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Suppliers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {supplier.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{supplier.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {SUPPLIER_CATEGORY_LABELS[supplier.category] ?? supplier.category}
              </span>
              {supplier.rating && (
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  {Array.from({ length: supplier.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-gray-500 ml-1">{supplier.rating}/5</span>
                </span>
              )}
              {!supplier.isActive && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
        <SupplierActions supplier={supplier} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {supplier.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <a href={`mailto:${supplier.email}`} className="text-sm text-indigo-600 hover:underline">
                      {supplier.email}
                    </a>
                  </div>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm text-gray-700">{supplier.phone}</p>
                  </div>
                </div>
              )}
              {supplier.website && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Website</p>
                    <a
                      href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline truncate max-w-[160px] block"
                    >
                      {supplier.website}
                    </a>
                  </div>
                </div>
              )}
              {(supplier.city || supplier.country) && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm text-gray-700">
                      {[supplier.city, supplier.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Manager */}
          {(supplier.contactName || supplier.contactEmail || supplier.contactPhone) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Account Manager</h2>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {supplier.contactName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{supplier.contactName}</p>
                  {supplier.contactEmail && (
                    <a href={`mailto:${supplier.contactEmail}`} className="text-xs text-indigo-600 hover:underline">
                      {supplier.contactEmail}
                    </a>
                  )}
                  {supplier.contactPhone && (
                    <p className="text-xs text-gray-400">{supplier.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Payment Ledger</h2>
              <SupplierAddPaymentButton supplierId={supplier.id} />
            </div>

            {supplier.payments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No payments recorded yet</p>
            ) : (
              <div className="space-y-2">
                {supplier.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          ₹{payment.amount.toLocaleString("en-IN")}
                        </p>
                        {payment.booking && (
                          <p className="text-xs text-gray-400">
                            Booking: {payment.booking.bookingRef}
                          </p>
                        )}
                        {payment.reference && (
                          <p className="text-xs text-gray-400">Ref: {payment.reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {payment.dueDate && (
                          <p className="text-xs text-gray-400">
                            Due: {format(new Date(payment.dueDate), "dd MMM yyyy")}
                          </p>
                        )}
                        {payment.paidDate && (
                          <p className="text-xs text-gray-400">
                            Paid: {format(new Date(payment.paidDate), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          SUPPLIER_PAYMENT_STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Payment Summary</h2>
            <div>
              <p className="text-xs text-gray-400">Total Paid</p>
              <p className="text-lg font-bold text-green-600">
                ₹{totalPaid.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pending / Overdue</p>
              <p className={`text-lg font-bold ${totalPending > 0 ? "text-amber-600" : "text-gray-400"}`}>
                ₹{totalPending.toLocaleString("en-IN")}
              </p>
            </div>
            {supplier.paymentTerms && (
              <div>
                <p className="text-xs text-gray-400">Payment Terms</p>
                <p className="text-sm text-gray-700">{supplier.paymentTerms}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {supplier.notes && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{supplier.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div>
              <p className="text-xs text-gray-400">Added</p>
              <p className="text-sm text-gray-700">{format(new Date(supplier.createdAt), "dd MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Transactions</p>
              <p className="text-sm font-semibold text-gray-800">{supplier.payments.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplierAddPaymentButton({ supplierId }: { supplierId: string }) {
  return (
    <button
      disabled
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
      title="Use the Add Payment button in actions"
    >
      <Plus className="w-3.5 h-3.5" />
      Add Payment
    </button>
  );
}
