import { getContacts } from "@/lib/actions/contacts";
import { LEAD_STATUS_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import Link from "next/link";
import { Users, Plus, Search, CalendarCheck, Briefcase, Upload } from "lucide-react";
import { NavSelect } from "@/components/ui/nav-select";
import { ConvertToDealButton } from "@/components/contacts/convert-to-deal-button";

interface ContactsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    source?: string;
    page?: string;
  }>;
}

function LeadScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-indigo-500" : score >= 40 ? "bg-amber-400" : "bg-gray-200";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700">{score}</span>
    </div>
  );
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");

  const { contacts, total, totalPages } = await getContacts({
    search: params.search,
    status: params.status,
    source: params.source,
    page,
    limit: 25,
  });

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { search: params.search, status: params.status, source: params.source, ...overrides };
    for (const [k, v] of Object.entries(merged)) { if (v) p.set(k, v); }
    return `/contacts?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} contact{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/contacts/import"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" /> Import
          </Link>
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Contact
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          <form method="GET" action="/contacts" className="flex items-center gap-2 flex-1 min-w-[200px]">
            {params.status && <input type="hidden" name="status" value={params.status} />}
            {params.source && <input type="hidden" name="source" value={params.source} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Search by name, email, phone..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">Search</button>
          </form>

          <NavSelect
            value={buildUrl({ status: params.status })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Statuses", href: buildUrl({ status: undefined }) },
              { label: "New", href: buildUrl({ status: "NEW" }) },
              { label: "Contacted", href: buildUrl({ status: "CONTACTED" }) },
              { label: "Qualified", href: buildUrl({ status: "QUALIFIED" }) },
              { label: "Proposal Sent", href: buildUrl({ status: "PROPOSAL_SENT" }) },
              { label: "Negotiation", href: buildUrl({ status: "NEGOTIATION" }) },
              { label: "Converted", href: buildUrl({ status: "CONVERTED" }) },
              { label: "Lost", href: buildUrl({ status: "LOST" }) },
            ]}
          />

          <NavSelect
            value={buildUrl({ source: params.source })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Sources", href: buildUrl({ source: undefined }) },
              { label: "Website", href: buildUrl({ source: "WEBSITE" }) },
              { label: "Referral", href: buildUrl({ source: "REFERRAL" }) },
              { label: "Social Media", href: buildUrl({ source: "SOCIAL_MEDIA" }) },
              { label: "Cold Call", href: buildUrl({ source: "COLD_CALL" }) },
              { label: "Email Campaign", href: buildUrl({ source: "EMAIL_CAMPAIGN" }) },
              { label: "Trade Show", href: buildUrl({ source: "TRADE_SHOW" }) },
            ]}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Stage</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Lead Score</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Activity</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Spend</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Owner</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-3">No contacts found</p>
                    <Link href="/contacts/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                      <Plus className="w-4 h-4" /> Add Contact
                    </Link>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div>
                          <Link href={`/contacts/${contact.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                            {contact.firstName} {contact.lastName}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {contact.email && <p className="text-xs text-gray-400 truncate max-w-[160px]">{contact.email}</p>}
                            {!contact.email && contact.phone && <p className="text-xs text-gray-400">{contact.phone}</p>}
                          </div>
                          {contact.company && (
                            <p className="text-xs text-gray-400 mt-0.5">{contact.company.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[contact.leadStatus]}`}>
                        {contact.leadStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <LeadScoreBar score={contact.leadScore} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {contact._count.deals > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                            {contact._count.deals}
                          </span>
                        )}
                        {contact._count.bookings > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarCheck className="w-3.5 h-3.5 text-green-500" />
                            {contact._count.bookings}
                          </span>
                        )}
                        {contact._count.deals === 0 && contact._count.bookings === 0 && (
                          <span className="text-xs text-gray-300">No activity</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {contact.totalSpent > 0 ? (
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{contact.totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {contact.owner ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                            {contact.owner.name?.[0] ?? "?"}
                          </div>
                          <span className="text-xs text-gray-600 truncate max-w-[80px]">{contact.owner.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-400">{format(new Date(contact.createdAt), "MMM d, yyyy")}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {contact._count.deals === 0 && (
                          <ConvertToDealButton
                            contactId={contact.id}
                            contactName={`${contact.firstName} ${contact.lastName}`}
                          />
                        )}
                        <Link href={`/contacts/${contact.id}`} className="text-xs text-gray-500 hover:text-indigo-600 font-medium">
                          Open →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
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
