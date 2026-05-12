"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  MoreVertical,
  Trash2,
  Send,
  ExternalLink,
  Calendar,
  ImageIcon,
  Video,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PlatformIcon } from "@/components/social/platform-icon"
import { deleteSocialPost, publishSocialPost } from "@/lib/actions/social"
import type { SocialPlatform, SocialPostStatus } from "@prisma/client"

type PostTarget = {
  id: string
  status: SocialPostStatus
  platformUrl: string | null
  errorMessage: string | null
  likes: number
  comments: number
  shares: number
  account: {
    id: string
    platform: SocialPlatform
    accountName: string
  }
}

type Post = {
  id: string
  caption: string
  mediaUrls: string[]
  mediaType: string
  status: SocialPostStatus
  scheduledAt: Date | null
  publishedAt: Date | null
  createdAt: Date
  createdBy: { name: string | null } | null
  targets: PostTarget[]
}

const STATUS_STYLES: Record<SocialPostStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHING: "bg-yellow-100 text-yellow-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PARTIALLY_PUBLISHED: "bg-orange-100 text-orange-700",
}

const STATUS_LABELS: Record<SocialPostStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHING: "Publishing...",
  PUBLISHED: "Published",
  FAILED: "Failed",
  PARTIALLY_PUBLISHED: "Partial",
}

interface PostCardProps {
  post: Post
  onDeleted?: () => void
}

export function PostCard({ post, onDeleted }: PostCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showMenu, setShowMenu] = useState(false)

  function handleDelete() {
    if (!confirm("Delete this post?")) return
    startTransition(async () => {
      try {
        await deleteSocialPost(post.id)
        toast.success("Post deleted")
        onDeleted?.()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed")
      }
    })
  }

  function handlePublish() {
    startTransition(async () => {
      try {
        const result = await publishSocialPost(post.id)
        if (result.success) {
          toast.success("Published to all platforms!")
        } else if (result.partialSuccess) {
          toast.warning("Partially published", { description: result.failedPlatforms.join(", ") })
        } else {
          toast.error("Publish failed", { description: result.failedPlatforms.join(", ") })
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Publish failed")
      }
    })
  }

  const firstImage = post.mediaUrls[0]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
      {/* Media preview */}
      {firstImage && (post.mediaType === "IMAGE" || post.mediaType === "CAROUSEL") && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img src={firstImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {(post.mediaType === "VIDEO" || post.mediaType === "REEL") && (
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <Video className="w-8 h-8 text-gray-400" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs font-medium ${STATUS_STYLES[post.status]}`}>
              {post.status === "PUBLISHING" && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              )}
              {STATUS_LABELS[post.status]}
            </Badge>
            {post.mediaType !== "TEXT" && (
              <Badge variant="outline" className="text-xs">
                {post.mediaType === "IMAGE" || post.mediaType === "CAROUSEL" ? (
                  <ImageIcon className="w-3 h-3 mr-1" />
                ) : (
                  <Video className="w-3 h-3 mr-1" />
                )}
                {post.mediaType}
              </Badge>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 z-10 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[140px]">
                {(post.status === "DRAFT" || post.status === "SCHEDULED" || post.status === "FAILED") && (
                  <button
                    onClick={() => { setShowMenu(false); handlePublish() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publish Now
                  </button>
                )}
                <button
                  onClick={() => { setShowMenu(false); handleDelete() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-gray-700 line-clamp-3 mb-3">{post.caption}</p>

        {/* Target platforms */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {post.targets.map((target) => (
            <div
              key={target.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border ${
                target.status === "PUBLISHED"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : target.status === "FAILED"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <PlatformIcon platform={target.account.platform} size={12} />
              <span>{target.account.accountName}</span>
              {target.platformUrl && (
                <a
                  href={target.platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-current opacity-60 hover:opacity-100"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Stats for published posts */}
        {post.status === "PUBLISHED" && (
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span>
              ❤️ {post.targets.reduce((s, t) => s + t.likes, 0).toLocaleString()}
            </span>
            <span>
              💬 {post.targets.reduce((s, t) => s + t.comments, 0).toLocaleString()}
            </span>
            <span>
              🔁 {post.targets.reduce((s, t) => s + t.shares, 0).toLocaleString()}
            </span>
          </div>
        )}

        {/* Date info */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="w-3 h-3" />
          {post.status === "SCHEDULED" && post.scheduledAt ? (
            <span>Scheduled {format(new Date(post.scheduledAt), "MMM d, yyyy 'at' h:mm a")}</span>
          ) : post.publishedAt ? (
            <span>Published {format(new Date(post.publishedAt), "MMM d, yyyy 'at' h:mm a")}</span>
          ) : (
            <span>Created {format(new Date(post.createdAt), "MMM d, yyyy")}</span>
          )}
        </div>
      </div>

      {isPending && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      )}
    </div>
  )
}
