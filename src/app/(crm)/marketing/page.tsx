import { getCampaigns, getTemplates, getSequences, getAutomationRules } from "@/lib/actions/marketing";
import Link from "next/link";
import { format } from "date-fns";
import {
  Megaphone,
  FileText,
  GitBranch,
  Zap,
  ArrowRight,
  Send,
  BarChart3,
  MousePointerClick,
} from "lucide-react";
import { CAMPAIGN_STATUS_COLORS } from "@/lib/constants";

export default async function MarketingPage() {
  const [
    { campaigns, total: totalCampaigns },
    templates,
    sequences,
    automations,
  ] = await Promise.all([
    getCampaigns({ limit: 5 }),
    getTemplates(),
    getSequences(),
    getAutomationRules(),
  ]);

  const activeSequences = sequences.filter((s) => s.isActive).length;
  const activeAutomations = automations.filter((a) => a.isActive).length;

  const totalSent = campaigns.reduce((sum, c) => sum + c.totalSent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  const MODULE_CARDS = [
    {
      title: "Campaigns",
      description: "Send broadcast emails, SMS, and WhatsApp campaigns",
      href: "/marketing/campaigns",
      icon: Megaphone,
      count: totalCampaigns,
      countLabel: "total campaigns",
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Templates",
      description: "Reusable message templates for email, SMS, and WhatsApp",
      href: "/marketing/templates",
      icon: FileText,
      count: templates.length,
      countLabel: "templates",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Sequences",
      description: "Automated drip sequences triggered by contact actions",
      href: "/marketing/sequences",
      icon: GitBranch,
      count: sequences.length,
      countLabel: `${activeSequences} active`,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Automations",
      description: "Rule-based automations triggered by CRM events",
      href: "/marketing/automations",
      icon: Zap,
      count: automations.length,
      countLabel: `${activeAutomations} active`,
      color: "bg-amber-100 text-amber-600",
    },
  ];

  const CHANNEL_ICONS: Record<string, string> = {
    EMAIL: "📧",
    SMS: "💬",
    WHATSAPP: "📱",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketing Hub</h1>
          <p className="text-sm text-gray-500">Campaigns, templates, sequences and automations</p>
        </div>
      </div>

      {/* Stat cards */}
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
            <p className="text-xs text-gray-500">Active Sequences</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeSequences}</p>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{card.description}</p>
                    <p className="text-xs font-medium text-indigo-600 mt-2">
                      {card.count} {card.countLabel}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent campaigns */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Campaigns</h2>
            <Link href="/marketing/campaigns" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {campaigns.map((campaign) => {
              const openRate = campaign.totalSent > 0
                ? Math.round((campaign.opened / campaign.totalSent) * 100)
                : 0;
              const clickRate = campaign.totalSent > 0
                ? Math.round((campaign.clicked / campaign.totalSent) * 100)
                : 0;
              return (
                <div key={campaign.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg" title={campaign.channel}>
                      {CHANNEL_ICONS[campaign.channel] ?? "📢"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}>
                          {campaign.status}
                        </span>
                        {campaign.sentAt && (
                          <span className="text-xs text-gray-400">
                            {format(new Date(campaign.sentAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Sent</p>
                      <p className="text-sm font-medium text-gray-700">{campaign.totalSent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Open</p>
                      <p className="text-sm font-medium text-gray-700">{openRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Click</p>
                      <p className="text-sm font-medium text-gray-700">{clickRate}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
