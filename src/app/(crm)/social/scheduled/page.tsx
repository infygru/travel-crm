import Link from "next/link"
import { ArrowLeft, Calendar, Plus, Clock, Pencil } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { getScheduledPosts } from "@/lib/actions/social"
import { PlatformIcon } from "@/components/social/platform-icon"
import { PublishNowButton } from "@/components/social/publish-now-button"
import { DeletePostButton } from "@/components/social/delete-post-button"

export default async function ScheduledPage() {
  const posts = await getScheduledPosts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/social"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Post Queue
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {posts.length} post{posts.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/social/calendar"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Calendar View
          </Link>
          <Link
            href="/social/compose"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-500 mb-1">No posts scheduled</h3>
          <p className="text-sm text-gray-400 mb-4">
            Create a post and schedule it to publish automatically at any time
          </p>
          <Link
            href="/social/compose"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule a Post
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {posts.map((post) => {
              const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null
              const isPast = scheduledDate ? scheduledDate < new Date() : false
              const timeFromNow = scheduledDate
                ? formatDistanceToNow(scheduledDate, { addSuffix: true })
                : null

              return (
                <div key={post.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Date badge */}
                    {scheduledDate && (
                      <div className="shrink-0 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                            {format(scheduledDate, "MMM")}
                          </p>
                          <p className="text-xl font-bold text-blue-800 leading-none">
                            {format(scheduledDate, "d")}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{format(scheduledDate, "h:mm a")}</p>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {post.targets.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-lg text-xs text-gray-600"
                            >
                              <PlatformIcon platform={t.account.platform} size={11} />
                              <span>{t.account.accountName}</span>
                            </div>
                          ))}
                        </div>
                        {isPast && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                            Overdue
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{post.caption}</p>

                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{timeFromNow}</span>
                        {post.createdBy?.name && (
                          <>
                            <span>•</span>
                            <span>by {post.createdBy.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/social/compose?edit=${post.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <PublishNowButton postId={post.id} />
                      <DeletePostButton postId={post.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
