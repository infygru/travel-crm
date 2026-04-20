"use client";

import { useState, useTransition } from "react";
import { sendMessage } from "@/lib/actions/conversations";
import { toast } from "sonner";
import { Send } from "lucide-react";

export function ReplyBox({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSend() {
    const text = body.trim();
    if (!text) return;
    setBody("");
    startTransition(async () => {
      try {
        await sendMessage(conversationId, text);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send message");
        setBody(text);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-gray-100 p-4 bg-white">
      <div className="flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          rows={2}
          disabled={pending}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!body.trim() || pending}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 self-end"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
