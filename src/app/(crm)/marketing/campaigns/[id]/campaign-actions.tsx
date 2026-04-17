"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Copy, Pencil, X, Check, Loader2 } from "lucide-react";
import { sendCampaign, duplicateCampaign, updateCampaign } from "@/lib/actions/marketing";

interface CampaignActionsProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    canSend: boolean;
  };
}

export function CampaignActions({ campaign }: CampaignActionsProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!confirm(`Send "${campaign.name}" to all matching contacts now?`)) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendCampaign(campaign.id);
      setSendResult({ sent: result.sent, failed: result.failed });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setError(null);
    try {
      const copy = await duplicateCampaign(campaign.id);
      router.push(`/marketing/campaigns/${copy.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate failed");
      setDuplicating(false);
    }
  }

  async function handleSaveName() {
    if (!editName.trim() || editName === campaign.name) {
      setEditing(false);
      setEditName(campaign.name);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateCampaign(campaign.id, { name: editName.trim() });
      router.refresh();
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {sendResult && (
        <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
          Sent {sendResult.sent}{sendResult.failed > 0 ? `, ${sendResult.failed} failed` : ""}
        </span>
      )}
      {error && (
        <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded max-w-xs truncate">
          {error}
        </span>
      )}

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSaveName();
              if (e.key === "Escape") { setEditing(false); setEditName(campaign.name); }
            }}
            className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
          />
          <button
            onClick={handleSaveName}
            disabled={saving}
            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setEditing(false); setEditName(campaign.name); }}
            className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          <Pencil className="w-4 h-4" />
          Edit Name
        </button>
      )}

      <button
        onClick={handleDuplicate}
        disabled={duplicating}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
      >
        {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
        Duplicate
      </button>

      {campaign.canSend && (
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending…" : "Send Now"}
        </button>
      )}
    </div>
  );
}
