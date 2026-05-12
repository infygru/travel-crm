import Link from "next/link"
import { format } from "date-fns"
import {
  Share2,
  Plus,
  Calendar,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  TrendingUp,
  FileText,
} from "lucide-react"
import { getSocialStats, getRecentPosts, getScheduledPosts } from "@/lib/actions/social"
import { PlatformIcon } from "@/components/social/platform-icon"
import { PLATFORM_CONFIGS } from "@/lib/social"
import type { SocialPlatform, SocialPostStatus } from "@prisma/client"

const STATUS_STYLES: Record<SocialPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHING: "bg-yellow-100 text-yellow-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PARTIALLY_PUBLISHED: "bg-orange-100 text-orange-700",
}

export default async function SocialPage() {
  const [stats, recentPosts, scheduledPosts] = await Promise.all([
    getSocialStats(),
    getRecentPosts(6),
    getScheduledPosts(),
  ])

  const KPI_CARDS = [
    {
      label: "Connected Accounts",
      value: stats.connectedAccounts,
      icon: Users,
      color: "bg-indigo-500/10 text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      label: "Published Posts",
      value: stats.publishedPosts,
      icon: CheckCircle2,
      color: "bg-green-500/10 text-green-600",
      iconBg: "bg-green-100",
    },
    {
      label: "Scheduled",
      value: stats.scheduledPosts,
      icon: Clock,
      color: "bg-blue-500/10 text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      label: "Total Engagement",
      value: (stats.totalLikes + stats.totalComments + stats.totalShares).toLocaleString(),
      icon: TrendingUp,
      color: "bg-rose-500/10 text-rose-600",
      iconBg: "bg-rose-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-indigo-500" />
            Social Media
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and publish to all your social platforms from one place
          </p>
        </div>
        <Link
          href="/social/compose"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color.split(" ")[1]}`} />
                </div>
                <span className="text-xs font-medium text-gray-500">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      {/* Connected platforms */}
      {stats.connectedAccounts === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <Share2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">No social accounts connected</h3>
          <p className="text-sm text-gray-400 mb-4">
            Connect your Facebook, Instagram, Twitter, LinkedIn, TikTok, or YouTube accounts to start posting.
          </p>
          <Link
            href="/social/accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Connect Accounts
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Connected Platforms</h2>
            <Link
              href="/social/accounts"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Manage accounts →
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(stats.platformBreakdown) as [SocialPlatform, number][]).map(
              ([platform, count]) => (
                <div
                  key={platform}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <PlatformIcon platform={platform} size={16} />
                  <span className="text-sm font-medium text-gray-700">
                    {PLATFORM_CONFIGS[platform].name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {count} account{count > 1 ? "s" : ""}
                  </span>
                </div>
              )
            )}
            <Link
              href="/social/accounts"
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Posts</h2>
            <Link
              href="/social/analytics"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              View Analytics
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Share2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No posts yet. Create your first post!</p>
              <Link
                href="/social/compose"
                className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Compose a post →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPosts.map((post) => (
                <div key={post.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{post.caption}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[post.status]}`}
                        >
                          {post.status.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-1">
                          {post.targets.map((t) => (
                            <PlatformIcon
                              key={t.id}
                              platform={t.account.platform}
                              size={12}
                            />
                          ))}
                        </div>
                        {post.publishedAt && (
                          <span className="text-xs text-gray-400">
                            {format(new Date(post.publishedAt), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    {post.targets.some((t) => t.platformUrl) && (
                      <a
                        href={post.targets.find((t) => t.platformUrl)?.platformUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-indigo-500 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming scheduled */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Scheduled
            </h2>
            <Link
              href="/social/scheduled"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <Calendar className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No scheduled posts</p>
              <Link
                href="/social/compose"
                className="inline-block mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Schedule a post →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {scheduledPosts.slice(0, 6).map((post) => (
                <div key={post.id} className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    {post.targets.map((t) => (
                      <PlatformIcon key={t.id} platform={t.account.platform} size={12} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">{post.caption}</p>
                  <p className="text-xs text-blue-500 font-medium">
                    {post.scheduledAt &&
                      format(new Date(post.scheduledAt), "MMM d, h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          {
            href: "/social/compose",
            icon: Plus,
            title: "Compose",
            desc: "New post",
            color: "border-indigo-200 hover:border-indigo-400",
            iconColor: "bg-indigo-100 text-indigo-600",
          },
          {
            href: "/social/calendar",
            icon: Calendar,
            title: "Calendar",
            desc: "Month view",
            color: "border-violet-200 hover:border-violet-400",
            iconColor: "bg-violet-100 text-violet-600",
          },
          {
            href: "/social/scheduled",
            icon: Clock,
            title: "Queue",
            desc: "Scheduled posts",
            color: "border-blue-200 hover:border-blue-400",
            iconColor: "bg-blue-100 text-blue-600",
          },
          {
            href: "/social/drafts",
            icon: FileText,
            title: "Drafts",
            desc: "Saved drafts",
            color: "border-gray-200 hover:border-gray-400",
            iconColor: "bg-gray-100 text-gray-600",
          },
          {
            href: "/social/analytics",
            icon: BarChart3,
            title: "Analytics",
            desc: "Performance",
            color: "border-emerald-200 hover:border-emerald-400",
            iconColor: "bg-emerald-100 text-emerald-600",
          },
        ].map(({ href, icon: Icon, title, desc, color, iconColor }) => (
          <Link
            key={href}
            href={href}
            className={`bg-white rounded-2xl border p-4 transition-all group ${color}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="font-semibold text-gray-800 text-sm">{title}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
