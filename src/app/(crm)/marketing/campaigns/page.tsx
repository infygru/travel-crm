import { getCampaigns } from "@/lib/actions/marketing";
import { CAMPAIGN_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { format } from "date-fns";
import { Megaphone, Plus, Send, BarChart3, MousePointerClick, GitBranch, ArrowLeft } from "lucide-react";
import { NavSelect } from "@/components/ui/nav-select";

interface CampaignsPageProps {
  searchParams: Promise<{
    status?: string;
    channel?: string;
    search?: string;
    page?: string;
  }>;
}

const CHANNEL_ICONS: Record<string, string> = {
  EMAIL: "📧",
  SMS: "💬",
  WHATSAPP: "📱",
};

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  const sp = await searchParams;
  const status = sp.status;
  const channel = sp.channel;
  const search = sp.search;
  const page = Number(sp.page ?? 1);

  const [{ campaigns, total, totalPages }, allCampaigns] = await Promise.all([
    getCampaigns({ status, channel, search, page, limit: 20 }),
    getCampaigns({ limit: 1000 }),
  ]);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status, channel, search, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/marketing/campaigns?${params.toString()}`;
  }

  const totalSent = allCampaigns.campaigns.reduce((s, c) => s + c.totalSent, 0);
  const totalOpened = allCampaigns.campaigns.reduce((s, c) => s + c.opened, 0);
  const totalClicked = allCampaigns.campaigns.reduce((s, c) => s + c.clicked, 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const activeSeqCount = allCampaigns.campaigns.filter(
    (c) => c.status === "SENDING" || c.status === "SCHEDULED"
  ).length;

  return (
    <div className="space-y-6">
      <Link href="/marketing" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketing
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500">{total} total campaigns</p>
          </div>
        </div>
        <Link
          href="/marketing/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-indigo-500" />
            <p className="text-xs text-gray-500">Total Sent</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-500">Avg Open Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgOpenRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <MousePointerClick className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500">Avg Click Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgClickRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-gray-500">Active / Scheduled</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeSeqCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          <form method="GET" action="/marketing/campaigns" className="flex items-center gap-2 flex-1 min-w-[200px]">
            {status && <input type="hidden" name="status" value={status} />}
            {channel && <input type="hidden" name="channel" value={channel} />}
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search campaigns..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200">
              Search
            </button>
          </form>

          <NavSelect
            value={buildUrl({ channel: channel ?? undefined, page: undefined })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Channels", href: buildUrl({ channel: undefined, page: undefined }) },
              { label: "Email", href: buildUrl({ channel: "EMAIL", page: undefined }) },
              { label: "SMS", href: buildUrl({ channel: "SMS", page: undefined }) },
              { label: "WhatsApp", href: buildUrl({ channel: "WHATSAPP", page: undefined }) },
            ]}
          />

          <NavSelect
            value={buildUrl({ status: status ?? undefined, page: undefined })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            options={[
              { label: "All Statuses", href: buildUrl({ status: undefined, page: undefined }) },
              { label: "Draft", href: buildUrl({ status: "DRAFT", page: undefined }) },
              { label: "Scheduled", href: buildUrl({ status: "SCHEDULED", page: undefined }) },
              { label: "Sending", href: buildUrl({ status: "SENDING", page: undefined }) },
              { label: "Sent", href: buildUrl({ status: "SENT", page: undefined }) },
              { label: "Paused", href: buildUrl({ status: "PAUSED", page: undefined }) },
              { label: "Cancelled", href: buildUrl({ status: "CANCELLED", page: undefined }) },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Click Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    No campaigns found.{" "}
                    <Link href="/marketing/campaigns/new" className="text-indigo-600 hover:text-indigo-700">Create your first campaign</Link>
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => {
                  const openRate = campaign.totalSent > 0
                    ? Math.round((campaign.opened / campaign.totalSent) * 100)
                    : 0;
                  const clickRate = campaign.totalSent > 0
                    ? Math.round((campaign.clicked / campaign.totalSent) * 100)
                    : 0;
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base" title={campaign.channel}>
                            {CHANNEL_ICONS[campaign.channel] ?? "📢"}
                          </span>
                          <div>
                            <Link href={`/marketing/campaigns/${campaign.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                              {campaign.name}
                            </Link>
                            <p className="text-xs text-gray-400 capitalize">
                              {campaign.type.toLowerCase()} · {campaign.channel.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-700">{campaign.totalSent.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${openRate >= 20 ? "text-green-600" : openRate >= 10 ? "text-yellow-600" : "text-gray-600"}`}>
                          {openRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${clickRate >= 5 ? "text-green-600" : clickRate >= 2 ? "text-yellow-600" : "text-gray-600"}`}>
                          {clickRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {campaign.sentAt
                            ? format(new Date(campaign.sentAt), "MMM d, yyyy")
                            : campaign.scheduledAt
                            ? `Scheduled ${format(new Date(campaign.scheduledAt), "MMM d, yyyy")}`
                            : format(new Date(campaign.createdAt), "MMM d, yyyy")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
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
