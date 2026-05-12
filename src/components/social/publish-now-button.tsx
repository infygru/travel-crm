"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Send, Loader2 } from "lucide-react"
import { publishSocialPost } from "@/lib/actions/social"

interface PublishNowButtonProps {
  postId: string
}

export function PublishNowButton({ postId }: PublishNowButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handlePublish() {
    startTransition(async () => {
      try {
        const result = await publishSocialPost(postId)
        if (result.success) {
          toast.success("Published successfully!")
        } else if (result.partialSuccess) {
          toast.warning("Partially published", {
            description: result.failedPlatforms.join(", "),
          })
        } else {
          toast.error("Publish failed", {
            description: result.failedPlatforms.join(", "),
          })
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Publish failed")
      }
    })
  }

  return (
    <button
      onClick={handlePublish}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {isPending ? "Publishing..." : "Publish Now"}
    </button>
  )
}
