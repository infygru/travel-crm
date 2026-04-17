import { getContacts } from "@/lib/actions/contacts";
import { getLeadAnalytics } from "@/lib/actions/leads";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, Phone, Mail, MessageCircle, TrendingUp, Users, CheckCircle,
  Globe, Search, Target, Star,
} from "lucide-react";
import { ConvertToDealButton } from "@/components/contacts/convert-to-deal-button";

interface LeadsPageProps {
  searchParams: Promise<{ status?: string; search?: string; source?: string; page?: string }>;
}

const STATUS_TABS = [
  { value: "", label: "All Leads", color: "text-gray-600" },
  { value: "NEW", label: "New", color: "text-blue-600" },
  { value: "CONTACTED", label: "Contacted", color: "text-yellow-600" },
  { value: "QUALIFIED", label: "Qualified", color: "text-purple-600" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent", color: "text-orange-600" },
  { value: "CONVERTED", label: "Won", color: "text-green-600" },
  { value: "LOST", label: "Lost", color: "text-red-600" },
];

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  CONTACTED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  QUALIFIED: "bg-purple-100 text-purple-700 border-purple-200",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700 border-orange-200",
  NEGOTIATION: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CONVERTED: "bg-green-100 text-green-700 border-green-200",
  LOST: "bg-red-100 text-red-700 border-red-200",
};

const SOURCE_ICONS: Record<string, React.ElementType> = {
  WEBSITE: Globe,
  SOCIAL_MEDIA: Globe,
  ADVERTISEMENT: Target,
  REFERRAL: Users,
  EMAIL_CAMPAIGN: Mail,
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  COLD_CALL: "Cold Call",
  EMAIL_CAMPAIGN: "Email",
  TRADE_SHOW: "Trade Show",
  PARTNER: "Partner",
  ADVERTISEMENT: "Ad",
  GOOGLE_ADS: "Google Ads",
  FACEBOOK: "Facebook",
  OTHER: "Other",
};

function ScoreDot({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-400" : "bg-red-400";
  const label = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      score >= 70 ? "bg-green-100 text-green-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label} · {score}
    </span>
  );
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const sp = await searchParams;
  const status = sp.status;
  const search = sp.search;
  const source = sp.source;
  const page = Number(sp.page ?? 1);

  const [{ contacts, total, totalPages }, analytics] = await Promise.all([
    getContacts({ status, search, source, page, limit: 24 }),
    getLeadAnalytics(),
  ]);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status, search, source, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/leads?${params.toString()}`;
  }

  const newCount = analytics.byStatus.find((s) => s.leadStatus === "NEW")?._count ?? 0;
  const qualifiedCount = analytics.byStatus.find((s) => s.leadStatus === "QUALIFIED")?._count ?? 0;
  const convertedCount = analytics.byStatus.find((s) => s.leadStatus === "CONVERTED")?._count ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} leads · {analytics.conversionRate}% conversion rate</p>
        </div>
        <Link
          href="/contacts/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>

      {/* Pipeline mini-stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "New Leads", value: newCount, color: "border-blue-400 bg-blue-50", text: "text-blue-700", href: buildUrl({ status: "NEW" }) },
          { label: "Qualified", value: qualifiedCount, color: "border-purple-400 bg-purple-50", text: "text-purple-700", href: buildUrl({ status: "QUALIFIED" }) },
          { label: "Converted", value: convertedCount, color: "border-green-400 bg-green-50", text: "text-green-700", href: buildUrl({ status: "CONVERTED" }) },
          { label: "Avg Score", value: analytics.avgScore, color: "border-amber-400 bg-amber-50", text: "text-amber-700", href: buildUrl({}) },
        ].map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-xl border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${s.color}`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Status tabs + search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto">
          {STATUS_TABS.map((s) => {
            const count = s.value
              ? (analytics.byStatus.find((x) => x.leadStatus === s.value)?._count ?? 0)
              : total;
            return (
              <Link
                key={s.value}
                href={buildUrl({ status: s.value || undefined, page: undefined })}
                className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  (status ?? "") === s.value
                    ? `border-indigo-600 ${s.color}`
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {s.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  (status ?? "") === s.value ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </Link>
            );
          })}

          {/* Search inline */}
          <div className="ml-auto flex-shrink-0 px-3 py-2">
            <form method="GET" action="/leads" className="flex items-center gap-2">
              {status && <input type="hidden" name="status" value={status} />}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="Search name, email..."
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                />
              </div>
              <button type="submit" className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">Go</button>
            </form>
          </div>
        </div>

        {/* Cards grid */}
        <div className="p-4">
          {contacts.length === 0 ? (
            <div className="text-center py-16">
              <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No leads found</p>
              <p className="text-sm text-gray-400 mt-1">Add a lead or set up a webhook to auto-capture from Google Ads / Facebook</p>
              <Link href="/contacts/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Add First Lead
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {contacts.map((contact) => {
                const SourceIcon = SOURCE_ICONS[contact.leadSource ?? ""] ?? Globe;
                const isConverted = contact.leadStatus === "CONVERTED";
                const hasDeals = contact._count.deals > 0;

                return (
                  <div
                    key={contact.id}
                    className={`relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col ${
                      contact.leadStatus === "NEW" ? "border-blue-200" :
                      contact.leadStatus === "QUALIFIED" ? "border-purple-200" :
                      isConverted ? "border-green-200" :
                      "border-gray-200"
                    }`}
                  >
                    {/* Status stripe */}
                    <div className={`h-1 rounded-t-xl ${
                      contact.leadStatus === "NEW" ? "bg-blue-400" :
                      contact.leadStatus === "CONTACTED" ? "bg-yellow-400" :
                      contact.leadStatus === "QUALIFIED" ? "bg-purple-500" :
                      contact.leadStatus === "PROPOSAL_SENT" ? "bg-orange-400" :
                      isConverted ? "bg-green-500" :
                      contact.leadStatus === "LOST" ? "bg-red-400" : "bg-gray-300"
                    }`} />

                    <div className="p-4 flex-1 flex flex-col gap-3">
                      {/* Top row: avatar + name + status */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/contacts/${contact.id}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 truncate block">
                            {contact.firstName} {contact.lastName}
                          </Link>
                          {contact.email && (
                            <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                          )}
                          {contact.phone && !contact.email && (
                            <p className="text-xs text-gray-400">{contact.phone}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[contact.leadStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {contact.leadStatus.replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* Score + source */}
                      <div className="flex items-center justify-between">
                        <ScoreDot score={contact.leadScore} />
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <SourceIcon className="w-3 h-3" />
                          {SOURCE_LABELS[contact.leadSource ?? ""] ?? contact.leadSource ?? "Unknown"}
                        </span>
                      </div>

                      {/* Notes preview */}
                      {contact.notes && (
                        <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
                          {contact.notes}
                        </p>
                      )}

                      {/* Activity indicators */}
                      {(hasDeals || contact._count.bookings > 0) && (
                        <div className="flex items-center gap-2">
                          {hasDeals && (
                            <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              {contact._count.deals} deal{contact._count.deals !== 1 ? "s" : ""}
                            </span>
                          )}
                          {contact._count.bookings > 0 && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              {contact._count.bookings} booking{contact._count.bookings !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Time */}
                      <p className="text-[10px] text-gray-300 mt-auto">
                        Added {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Action bar */}
                    <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-1.5">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Email"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                      )}
                      <div className="ml-auto">
                        {!isConverted && !hasDeals ? (
                          <ConvertToDealButton
                            contactId={contact.id}
                            contactName={`${contact.firstName} ${contact.lastName}`}
                          />
                        ) : (
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Star className="w-3.5 h-3.5" /> View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} leads</p>
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
    </div>
  );
}
