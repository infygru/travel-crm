"use client";

import { useState } from "react";
import { addTicketReply, changeTicketStatus } from "@/lib/actions/tickets";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Lock } from "lucide-react";

interface TicketActionsProps {
  ticketId: string;
  currentStatus: string;
}

const STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PENDING_CUSTOMER", label: "Pending Customer" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      await addTicketReply(ticketId, body, isInternal);
      setBody("");
      toast.success(isInternal ? "Internal note added" : "Reply sent");
      router.refresh();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    setChangingStatus(true);
    try {
      await changeTicketStatus(ticketId, newStatus);
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div className={`p-4 border-t border-gray-100 ${isInternal ? "bg-yellow-50" : ""}`}>
      <form onSubmit={handleReply} className="space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isInternal ? "Add an internal note (only visible to team)..." : "Write a reply to the customer..."}
          rows={4}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
            isInternal ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
          }`}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Lock className="w-3.5 h-3.5" />
              Internal Note
            </span>
          </label>

          <div className="flex items-center gap-2">
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={changingStatus}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending..." : isInternal ? "Add Note" : "Reply"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
