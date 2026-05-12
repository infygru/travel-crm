import Link from "next/link"
import { ArrowLeft, BarChart3, TrendingUp, Heart, MessageCircle, Share2, Eye, Info } from "lucide-react"
import { format } from "date-fns"
import { getSocialStats, getSocialPosts } from "@/lib/actions/social"
import { PlatformIcon } from "@/components/social/platform-icon"
import { SyncEngagementButton } from "@/components/social/sync-engagement-button"
import { PLATFORM_CONFIGS } from "@/lib/social"
import type { SocialPlatform } from "@prisma/client"

export default async function SocialAnalyticsPage() {
  const [stats, { posts }] = await Promise.all([
    getSocialStats(),
    getSocialPosts({ status: "PUBLISHED", limit: 50 }),
  ])

  const engagementByPlatform: Record<string, { likes: number; comments: number; shares: number; impressions: number; posts: number }> = {}

  for (const post of posts) {
    for (const target of post.targets) {
      const p = target.account.platform
      if (!engagementByPlatform[p]) {
        engagementByPlatform[p] = { likes: 0, comments: 0, shares: 0, impressions: 0, posts: 0 }
      }
      engagementByPlatform[p].likes += target.likes
      engagementByPlatform[p].comments += target.comments
      engagementByPlatform[p].shares += target.shares
      engagementByPlatform[p].impressions += target.impressions
      engagementByPlatform[p].posts++
    }
  }

  const hasAnyEngagement = stats.totalLikes + stats.totalComments + stats.totalShares + stats.totalImpressions > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/social"
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your social media performance</p>
        </div>
      </div>

      {/* Sync hint */}
      {!hasAnyEngagement && posts.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Engagement metrics are at zero</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Use the sync button (↻) next to each post below to pull the latest likes, comments, and shares from the platform APIs.
              Metrics only become available after the post has been live for a few minutes.
            </p>
          </div>
        </div>
      )}

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Total Comments", value: stats.totalComments, icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Total Shares", value: stats.totalShares, icon: Share2, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Total Impressions", value: stats.totalImpressions, icon: Eye, color: "text-purple-500", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-xs font-medium text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Per-platform breakdown */}
      {Object.keys(engagementByPlatform).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Performance by Platform</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Posts</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Likes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comments</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shares</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Impressions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(Object.entries(engagementByPlatform) as [SocialPlatform, typeof engagementByPlatform[string]][]).map(
                  ([platform, data]) => {
                    const totalEng = data.likes + data.comments + data.shares
                    const avgEng = data.posts > 0 ? (totalEng / data.posts).toFixed(1) : "0"
                    return (
                      <tr key={platform} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={platform} size={16} />
                            <span className="font-medium text-gray-800">
                              {PLATFORM_CONFIGS[platform].name}
                            </span>
                          </div>
                        </td>
                        <td className="text-right px-4 py-3 text-gray-600">{data.posts}</td>
                        <td className="text-right px-4 py-3 text-gray-600">{data.likes.toLocaleString()}</td>
                        <td className="text-right px-4 py-3 text-gray-600">{data.comments.toLocaleString()}</td>
                        <td className="text-right px-4 py-3 text-gray-600">{data.shares.toLocaleString()}</td>
                        <td className="text-right px-5 py-3 text-gray-600">{data.impressions.toLocaleString()}</td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post performance table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Post Performance</h2>
          <span className="text-xs text-gray-400">{posts.length} published posts</span>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No published posts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Post</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platforms</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">❤️</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">💬</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">🔁</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Published</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-gray-700 line-clamp-1 max-w-xs">{post.caption}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {post.targets.map((t) => (
                          <PlatformIcon key={t.id} platform={t.account.platform} size={13} />
                        ))}
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-600">
                      {post.targets.reduce((s, t) => s + t.likes, 0).toLocaleString()}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-600">
                      {post.targets.reduce((s, t) => s + t.comments, 0).toLocaleString()}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-600">
                      {post.targets.reduce((s, t) => s + t.shares, 0).toLocaleString()}
                    </td>
                    <td className="text-right px-5 py-3 text-gray-400 text-xs">
                      {post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <SyncEngagementButton postId={post.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
