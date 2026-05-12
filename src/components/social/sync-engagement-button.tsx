"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { RefreshCw, Loader2 } from "lucide-react"
import { syncPostEngagement } from "@/lib/actions/social"

export function SyncEngagementButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleSync() {
    startTransition(async () => {
      try {
        const result = await syncPostEngagement(postId)
        if (result.synced > 0) {
          toast.success(`Synced metrics from ${result.synced} platform${result.synced > 1 ? "s" : ""}`)
        } else {
          toast.info("No metrics available to sync yet")
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sync failed")
      }
    })
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      title="Sync engagement metrics from platform"
      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
    </button>
  )
}
