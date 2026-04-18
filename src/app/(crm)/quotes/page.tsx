import { getQuotes } from "@/lib/actions/quotes";
import { QUOTE_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { NewQuoteDialog } from "@/components/quotes/new-quote-dialog";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { formatCurrency } from "@/lib/currency";
import { getCompanySettings } from "@/lib/actions/settings";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const [{ quotes, total }, contacts, deals, settings] = await Promise.all([
    getQuotes({
      search: params.search,
      status: params.status,
      page: Number(params.page ?? 1),
    }),
    db.contact.findMany({
      select: { id: true, firstName: true, lastName: true, email: true },
      where: { isActive: true },
      orderBy: { firstName: "asc" },
      take: 100,
    }),
    db.deal.findMany({
      select: { id: true, title: true },
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getCompanySettings(),
  ]);

  const statuses = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED", "CONVERTED"];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} quote{total !== 1 ? "s" : ""} total</p>
        </div>
        <NewQuoteDialog contacts={contacts} deals={deals} />
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 mb-6">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search by title, number, or contact..."
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          Filter
        </button>
        {(params.search || params.status) && (
          <Link href="/quotes" className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </Link>
        )}
      </form>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <FileText className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No quotes yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first proposal to send to a client.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_60px] bg-gray-50 border-b border-gray-100">
            {["#", "Title", "Contact", "Amount", "Status", "Valid Until", ""].map((h) => (
              <div key={h} className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/quotes/${quote.id}`}
              className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_60px] border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
            >
              <div className="px-4 py-3 flex items-center">
                <span className="text-xs font-mono text-gray-500">{quote.quoteNumber}</span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{quote.title}</p>
                  {quote.deal && (
                    <p className="text-xs text-gray-400 truncate">{quote.deal.title}</p>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 flex items-center">
                {quote.contact ? (
                  <span className="text-sm text-gray-700">
                    {quote.contact.firstName} {quote.contact.lastName}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(quote.totalAmount, settings.currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[quote.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {quote.status}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center">
                {quote.validUntil ? (
                  <span className="text-xs text-gray-500">{format(new Date(quote.validUntil), "dd MMM yyyy")}</span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
              <div className="px-2 py-3 flex items-center">
                <span className="text-xs text-gray-400 hover:text-indigo-600 font-medium">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
