import { getQuote } from "@/lib/actions/quotes";
import { getCompanySettings } from "@/lib/actions/settings";
import { formatCurrency } from "@/lib/currency";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, User, Briefcase, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { QUOTE_STATUS_COLORS } from "@/lib/constants";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { QuoteItemsEditor } from "@/components/quotes/quote-items-editor";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, settings] = await Promise.all([
    getQuote(id),
    getCompanySettings(),
  ]);
  if (!quote) notFound();

  const shareUrl = quote.shareToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/q/${quote.shareToken}`
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/quotes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to Quotes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono text-gray-400">{quote.quoteNumber}</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[quote.status] ?? "bg-gray-100 text-gray-600"}`}>
              {quote.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{quote.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Created {format(new Date(quote.createdAt), "dd MMM yyyy")}
            {quote.createdBy && ` by ${quote.createdBy.name}`}
          </p>
        </div>
        <QuoteActions quote={quote} shareUrl={shareUrl} />
      </div>

      {/* Status timeline */}
      {quote.status !== "DRAFT" && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-xl">
          {quote.sharedAt && (
            <div className="flex items-center gap-1.5 text-xs text-blue-700">
              <Clock className="w-3.5 h-3.5" />
              Sent {format(new Date(quote.sharedAt), "dd MMM yyyy")}
            </div>
          )}
          {quote.acceptedAt && (
            <>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1.5 text-xs text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accepted {format(new Date(quote.acceptedAt), "dd MMM yyyy")}
              </div>
            </>
          )}
          {quote.declinedAt && (
            <>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1.5 text-xs text-red-700">
                <XCircle className="w-3.5 h-3.5" />
                Declined {format(new Date(quote.declinedAt), "dd MMM yyyy")}
                {quote.declineReason && ` — "${quote.declineReason}"`}
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Line items editor */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Line Items</h2>
            <QuoteItemsEditor
              quoteId={quote.id}
              initialItems={quote.items}
              currency={quote.currency}
              canEdit={quote.status === "DRAFT"}
            />
          </div>

          {/* Totals */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="space-y-3 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(quote.subtotal, settings.currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-red-600">
                    −{formatCurrency(quote.discount, settings.currency, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              {quote.taxes > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxes & Fees</span>
                  <span className="font-medium text-gray-900">
                    +{formatCurrency(quote.taxes, settings.currency, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-indigo-600">
                  {formatCurrency(quote.totalAmount, settings.currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(quote.notes || quote.terms) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              {quote.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-gray-500 whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Client info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Client</h2>
            {quote.contact ? (
              <Link href={`/contacts/${quote.contact.id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {quote.contact.firstName[0]}{quote.contact.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{quote.contact.firstName} {quote.contact.lastName}</p>
                  {quote.contact.email && <p className="text-xs text-gray-400">{quote.contact.email}</p>}
                </div>
              </Link>
            ) : (
              <p className="text-sm text-gray-400">No contact linked</p>
            )}
          </div>

          {/* Deal link */}
          {quote.deal && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Deal</h2>
              <Link href={`/deals/${quote.deal.id}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                <Briefcase className="w-4 h-4" />
                {quote.deal.title}
              </Link>
            </div>
          )}

          {/* Share link */}
          {shareUrl && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Share Link</h2>
              <p className="text-xs text-gray-400 mb-2">Send this link to your client to view and accept the quote.</p>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs font-mono text-gray-600 break-all">{shareUrl}</p>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            {quote.validUntil && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Valid Until</p>
                  <p className="text-sm text-gray-700">{format(new Date(quote.validUntil), "dd MMM yyyy")}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Currency</p>
                <p className="text-sm font-medium text-gray-700">{quote.currency}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Items</p>
              <p className="text-sm font-semibold text-gray-800">{quote.items.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
