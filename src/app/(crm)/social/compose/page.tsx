import Link from "next/link"
import { ArrowLeft, Share2, Edit3 } from "lucide-react"
import { getSocialAccounts, getPostById } from "@/lib/actions/social"
import { PostComposer } from "@/components/social/post-composer"

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ mediaUrl?: string; caption?: string; edit?: string; date?: string }>
}) {
  const [accounts, params] = await Promise.all([
    getSocialAccounts(),
    searchParams,
  ])

  const isEditing = !!params.edit
  let editPost: React.ComponentProps<typeof PostComposer>["editPost"] = undefined

  if (params.edit) {
    try {
      const post = await getPostById(params.edit)
      if (post.status === "DRAFT" || post.status === "SCHEDULED") {
        editPost = {
          id: post.id,
          caption: post.caption,
          mediaUrls: post.mediaUrls,
          mediaType: post.mediaType,
          scheduledAt: post.scheduledAt,
          firstComment: post.firstComment,
          tags: post.tags,
          accountIds: post.targets.map((t) => t.account.id),
        }
      }
    } catch {
      // Post not found or published — fall through to create mode
    }
  }

  const defaultMediaUrls = params.mediaUrl ? [params.mediaUrl] : []
  const defaultCaption = params.caption ? decodeURIComponent(params.caption) : ""
  const defaultScheduledAt = params.date ? decodeURIComponent(params.date) : undefined

  // If a date was passed via query param (from calendar), pre-fill defaultCaption won't work
  // Instead pass as accountIds default — handled below in composer via date
  // We only use defaultCaption for new posts
  const finalDefaultCaption = editPost ? "" : defaultCaption

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
            {isEditing ? (
              <Edit3 className="w-6 h-6 text-indigo-500" />
            ) : (
              <Share2 className="w-6 h-6 text-indigo-500" />
            )}
            {isEditing ? "Edit Post" : "Compose Post"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing
              ? "Update your draft or scheduled post"
              : "Write once, publish everywhere. Select platforms and schedule or post immediately."}
          </p>
        </div>
      </div>

      <PostComposer
        accounts={accounts}
        defaultMediaUrls={defaultMediaUrls}
        defaultCaption={finalDefaultCaption}
        editPost={editPost}
      />
    </div>
  )
}
