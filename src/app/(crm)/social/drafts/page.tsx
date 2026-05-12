import Link from "next/link"
import { ArrowLeft, FileText, Plus, Pencil, Clock } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { getDraftPosts } from "@/lib/actions/social"
import { PlatformIcon } from "@/components/social/platform-icon"
import { PublishNowButton } from "@/components/social/publish-now-button"
import { DeletePostButton } from "@/components/social/delete-post-button"

export default async function DraftsPage() {
  const posts = await getDraftPosts()

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
              <FileText className="w-6 h-6 text-gray-500" />
              Drafts
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {posts.length} saved draft{posts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link
          href="/social/compose"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-500 mb-1">No drafts saved</h3>
          <p className="text-sm text-gray-400 mb-4">
            Compose a post and save it as a draft to finish later
          </p>
          <Link
            href="/social/compose"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Compose Post
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Draft icon */}
                  <div className="shrink-0 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mt-0.5">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {post.targets.length > 0 ? (
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
                      ) : (
                        <span className="text-xs text-gray-400 italic">No accounts selected</span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        Draft
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-1.5">{post.caption}</p>

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        Created {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </span>
                      {post.createdBy?.name && (
                        <>
                          <span>•</span>
                          <span>by {post.createdBy.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
