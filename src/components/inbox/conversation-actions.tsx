"use client";

import { useTransition } from "react";
import { resolveConversation } from "@/lib/actions/conversations";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function ResolveButton({ conversationId, status }: { conversationId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleResolve() {
    startTransition(async () => {
      try {
        await resolveConversation(conversationId);
        toast.success("Conversation resolved");
        router.push("/inbox");
      } catch {
        toast.error("Failed to resolve conversation");
      }
    });
  }

  if (status === "RESOLVED") return null;

  return (
    <button
      onClick={handleResolve}
      disabled={pending}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
    >
      <CheckCircle className="w-3.5 h-3.5" />
      {pending ? "Resolving..." : "Resolve"}
    </button>
  );
}
