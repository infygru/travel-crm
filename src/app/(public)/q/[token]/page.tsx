import { getQuoteByShareToken } from "@/lib/actions/quotes";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { QuoteClientActions } from "./quote-client-actions";
import { formatCurrency } from "@/lib/currency";
import { getCompanySettings } from "@/lib/actions/settings";

const TYPE_COLORS: Record<string, string> = {
  FLIGHT: "bg-sky-100 text-sky-700",
  HOTEL: "bg-amber-100 text-amber-700",
  ACTIVITY: "bg-green-100 text-green-700",
  TRANSFER: "bg-purple-100 text-purple-700",
  VISA: "bg-orange-100 text-orange-700",
  INSURANCE: "bg-pink-100 text-pink-700",
  SERVICE: "bg-indigo-100 text-indigo-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [quote, settings] = await Promise.all([getQuoteByShareToken(token), getCompanySettings()]);
  if (!quote) notFound();

  const isExpired =
    quote.validUntil && new Date(quote.validUntil) < new Date() && quote.status === "SENT";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Quote Proposal</p>
            <p className="text-sm font-semibold text-gray-800">{quote.quoteNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Status banner */}
        {quote.status === "ACCEPTED" && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-700">
              You accepted this quote on {quote.acceptedAt ? format(new Date(quote.acceptedAt), "dd MMMM yyyy") : ""}
            </p>
          </div>
        )}
        {quote.status === "DECLINED" && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-700">You declined this quote.</p>
          </div>
        )}
        {isExpired && (
          <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
            <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm font-medium text-orange-700">
              This quote expired on {format(new Date(quote.validUntil!), "dd MMMM yyyy")}.
            </p>
          </div>
        )}

        {/* Quote title */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quote.title}</h1>
          {quote.contact && (
            <p className="text-sm text-gray-500">
              Prepared for: <strong className="text-gray-700">{quote.contact.firstName} {quote.contact.lastName}</strong>
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span>Ref: {quote.quoteNumber}</span>
            {quote.validUntil && (
              <span>Valid until: {format(new Date(quote.validUntil), "dd MMMM yyyy")}</span>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">What&apos;s Included</h2>
          </div>
          {quote.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {item.type}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{item.description}</p>
                  {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                  <p className="text-xs text-gray-400">
                    {item.quantity} × {formatCurrency(item.unitPrice, settings.currency, { maximumFractionDigits: 0 })}
                    {item.discount > 0 && ` (${item.discount}% off)`}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.totalPrice, settings.currency, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="px-5 py-4 bg-gray-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(quote.subtotal, settings.currency, { maximumFractionDigits: 0 })}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-green-600">−{formatCurrency(quote.discount, settings.currency, { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            {quote.taxes > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxes & Fees</span>
                <span className="font-medium">+{formatCurrency(quote.taxes, settings.currency, { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
              <span>Total ({quote.currency})</span>
              <span className="text-indigo-600">{formatCurrency(quote.totalAmount, settings.currency, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Notes</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Terms */}
        {quote.terms && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h2>
            <p className="text-sm text-gray-500 whitespace-pre-wrap">{quote.terms}</p>
          </div>
        )}

        {/* Accept / Decline */}
        {quote.status === "SENT" && !isExpired && (
          <QuoteClientActions token={token} />
        )}
      </div>
    </div>
  );
}
