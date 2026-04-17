import { getItineraries, getItineraryStats } from "@/lib/actions/itineraries";
import { ITINERARY_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { format } from "date-fns";
import { Map, Plus, FileText, Share2, CheckCircle2, Archive } from "lucide-react";
import { NavSelect } from "@/components/ui/nav-select";

interface ItinerariesPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ItinerariesPage({ searchParams }: ItinerariesPageProps) {
  const sp = await searchParams;
  const status = sp.status;
  const search = sp.search;
  const page = Number(sp.page ?? 1);

  const [{ itineraries, total, totalPages }, stats] = await Promise.all([
    getItineraries({ status, search, page, limit: 20 }),
    getItineraryStats(),
  ]);

  const { draft: draftCount, shared: sharedCount, approved: approvedCount } = stats;

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status, search, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/itineraries?${params.toString()}`;
  }

  const ITEM_TYPE_ICONS: Record<string, string> = {
    FLIGHT: "✈️",
    HOTEL: "🏨",
    ACTIVITY: "🎯",
    TRANSFER: "🚗",
    MEAL: "🍽️",
    FREE_TIME: "🌅",
    OTHER: "📌",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Map className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Itineraries</h1>
            <p className="text-sm text-gray-500">{total} total itineraries</p>
          </div>
        </div>
        <Link
          href="/itineraries/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Itinerary
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Map className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500">Draft</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500">Shared</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{sharedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-500">Approved</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <form method="GET" action="/itineraries" className="flex items-center gap-2 flex-1">
            {status && <input type="hidden" name="status" value={status} />}
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search itineraries..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200">
              Search
            </button>
          </form>
          <NavSelect
            value={buildUrl({ status: status ?? undefined, page: undefined })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Statuses", href: buildUrl({ status: undefined, page: undefined }) },
              { label: "Draft", href: buildUrl({ status: "DRAFT", page: undefined }) },
              { label: "Shared", href: buildUrl({ status: "SHARED", page: undefined }) },
              { label: "Approved", href: buildUrl({ status: "APPROVED", page: undefined }) },
              { label: "Booked", href: buildUrl({ status: "BOOKED", page: undefined }) },
              { label: "Archived", href: buildUrl({ status: "ARCHIVED", page: undefined }) },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {itineraries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    No itineraries found
                  </td>
                </tr>
              ) : (
                itineraries.map((itin) => (
                  <tr key={itin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/itineraries/${itin.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                        {itin.title}
                      </Link>
                      {itin.deal && (
                        <p className="text-xs text-gray-400 mt-0.5">{itin.deal.title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {itin.contact ? (
                        <Link href={`/contacts/${itin.contact.id}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                          {itin.contact.firstName} {itin.contact.lastName}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ITINERARY_STATUS_COLORS[itin.status]}`}>
                        {itin.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{itin._count.days} days</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{itin.totalCost.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">v{itin.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      {itin.startDate ? (
                        <span className="text-xs text-gray-500">
                          {format(new Date(itin.startDate), "MMM d")}
                          {itin.endDate ? ` – ${format(new Date(itin.endDate), "MMM d, yyyy")}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No dates</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/itineraries/${itin.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View
                        </Link>
                        {itin.shareToken && itin.status === "SHARED" && (
                          <a
                            href={`/itinerary/${itin.shareToken}`}
                            target="_blank"
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Preview
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
