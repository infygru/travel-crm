import { getCampaignById } from "@/lib/actions/marketing";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft, Send, Copy, BarChart3, MousePointerClick,
  Users, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { CAMPAIGN_STATUS_COLORS } from "@/lib/constants";
import { CampaignActions } from "./campaign-actions";

interface Props {
  params: Promise<{ id: string }>;
}

const CHANNEL_ICONS: Record<string, string> = { EMAIL: "📧", SMS: "💬", WHATSAPP: "📱" };

const SEND_STATUS_COLORS: Record<string, string> = {
  SENT: "bg-green-100 text-green-700",
  DELIVERED: "bg-green-100 text-green-700",
  OPENED: "bg-blue-100 text-blue-700",
  CLICKED: "bg-indigo-100 text-indigo-700",
  FAILED: "bg-red-100 text-red-700",
  BOUNCED: "bg-orange-100 text-orange-700",
  UNSUBSCRIBED: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-700",
};

export default async function CampaignDetailPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const openRate = campaign.totalSent > 0 ? Math.round((campaign.opened / campaign.totalSent) * 100) : 0;
  const clickRate = campaign.totalSent > 0 ? Math.round((campaign.clicked / campaign.totalSent) * 100) : 0;
  const deliverRate = campaign.totalSent > 0 ? Math.round((campaign.delivered / campaign.totalSent) * 100) : 0;

  const canSend = campaign.status === "DRAFT" || campaign.status === "SCHEDULED";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/marketing/campaigns" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{CHANNEL_ICONS[campaign.channel] ?? "📢"}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}>
                {campaign.status}
              </span>
              <span className="text-xs text-gray-400 capitalize">{campaign.type.toLowerCase()} · {campaign.channel.toLowerCase()}</span>
              {campaign.createdBy && (
                <span className="text-xs text-gray-400">by {campaign.createdBy.name}</span>
              )}
            </div>
          </div>
        </div>
        <CampaignActions campaign={{ id: campaign.id, name: campaign.name, status: campaign.status, canSend }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: campaign.totalSent.toLocaleString(), icon: Send, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Open Rate", value: `${openRate}%`, icon: BarChart3, color: openRate >= 20 ? "text-green-600" : "text-yellow-600", bg: openRate >= 20 ? "bg-green-50" : "bg-yellow-50" },
          { label: "Click Rate", value: `${clickRate}%`, icon: MousePointerClick, color: clickRate >= 5 ? "text-green-600" : "text-gray-600", bg: clickRate >= 5 ? "bg-green-50" : "bg-gray-50" },
          { label: "Recipients", value: campaign._count.sends.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Campaign Content */}
        <div className="xl:col-span-2 space-y-4">
          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Campaign Details</h2>
            <dl className="space-y-3">
              {campaign.channel === "EMAIL" && campaign.subject && (
                <div className="flex gap-3">
                  <dt className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Subject</dt>
                  <dd className="text-sm text-gray-900">{campaign.subject}</dd>
                </div>
              )}
              {campaign.fromEmail && (
                <div className="flex gap-3">
                  <dt className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">From</dt>
                  <dd className="text-sm text-gray-900">{campaign.fromName ? `${campaign.fromName} <${campaign.fromEmail}>` : campaign.fromEmail}</dd>
                </div>
              )}
              {campaign.replyTo && (
                <div className="flex gap-3">
                  <dt className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Reply-To</dt>
                  <dd className="text-sm text-gray-900">{campaign.replyTo}</dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Audience</dt>
                <dd className="text-sm text-gray-900">{
                  !campaign.segmentId || campaign.segmentId === "all" ? "All Active Contacts" :
                  campaign.segmentId === "new" ? "New Leads" :
                  campaign.segmentId === "qualified" ? "Qualified Leads" :
                  campaign.segmentId === "converted" ? "Existing Customers" :
                  campaign.segment?.name ?? campaign.segmentId
                }</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Created</dt>
                <dd className="text-sm text-gray-900">{format(new Date(campaign.createdAt), "MMM d, yyyy h:mm a")}</dd>
              </div>
              {campaign.sentAt && (
                <div className="flex gap-3">
                  <dt className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Sent At</dt>
                  <dd className="text-sm text-gray-900">{format(new Date(campaign.sentAt), "MMM d, yyyy h:mm a")}</dd>
                </div>
              )}
              {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
                <div className="flex gap-3">
                  <dt className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Scheduled</dt>
                  <dd className="text-sm text-indigo-600 font-medium">{format(new Date(campaign.scheduledAt), "MMM d, yyyy h:mm a")}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Message Body */}
          {campaign.body && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Message Body</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">
                {campaign.body}
              </pre>
              <p className="text-xs text-gray-400 mt-2">Variables: {"{{firstName}}"}, {"{{lastName}}"}, {"{{fullName}}"}</p>
            </div>
          )}
        </div>

        {/* Sidebar: Recent Sends */}
        <div className="space-y-4">
          {campaign.status === "SENT" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Delivery</h2>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {deliverRate}% delivered
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {campaign.sends.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">No sends yet</div>
                ) : (
                  campaign.sends.map(send => (
                    <div key={send.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {send.contact.firstName} {send.contact.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{send.contact.email}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${SEND_STATUS_COLORS[send.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {send.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {campaign._count.sends > 20 && (
                <div className="px-4 py-2 border-t border-gray-100 text-center text-xs text-gray-400">
                  Showing 20 of {campaign._count.sends.toLocaleString()} sends
                </div>
              )}
            </div>
          )}

          {/* Summary stats if sent */}
          {campaign.status === "SENT" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Performance</h2>
              {[
                { label: "Sent", value: campaign.totalSent, icon: Send, color: "text-indigo-600" },
                { label: "Delivered", value: campaign.delivered, icon: CheckCircle2, color: "text-green-600" },
                { label: "Opened", value: campaign.opened, icon: BarChart3, color: "text-blue-600" },
                { label: "Clicked", value: campaign.clicked, icon: MousePointerClick, color: "text-purple-600" },
                { label: "Bounced", value: campaign.bounced, icon: XCircle, color: "text-orange-600" },
                { label: "Unsubscribed", value: campaign.unsubscribed, icon: Clock, color: "text-gray-500" },
              ].map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${row.color}`} />
                      <span className="text-sm text-gray-600">{row.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{row.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
