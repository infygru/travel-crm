"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"
import { deleteSocialPost } from "@/lib/actions/social"

interface DeletePostButtonProps {
  postId: string
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Delete this scheduled post?")) return
    startTransition(async () => {
      try {
        await deleteSocialPost(postId)
        toast.success("Post deleted")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed")
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center justify-center w-8 h-8 rounded-xl border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}
