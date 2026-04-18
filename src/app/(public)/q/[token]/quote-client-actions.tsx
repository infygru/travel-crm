"use client";

import { useState } from "react";
import { acceptQuote, declineQuote } from "@/lib/actions/quotes";
import { CheckCircle2, XCircle, X } from "lucide-react";

export function QuoteClientActions({ token }: { token: string }) {
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  async function handleAccept() {
    setLoading("accept");
    try {
      await acceptQuote(token);
      setDone("accepted");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept quote");
    } finally {
      setLoading(null);
    }
  }

  async function handleDecline() {
    setLoading("decline");
    try {
      await declineQuote(token, declineReason || undefined);
      setDone("declined");
      setDeclineOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to decline quote");
    } finally {
      setLoading(null);
    }
  }

  if (done === "accepted") {
    return (
      <div className="flex items-center gap-3 p-5 bg-green-50 border border-green-200 rounded-2xl">
        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-800">Quote Accepted!</p>
          <p className="text-sm text-green-600 mt-0.5">Thank you! Our team will be in touch with you shortly.</p>
        </div>
      </div>
    );
  }

  if (done === "declined") {
    return (
      <div className="flex items-center gap-3 p-5 bg-gray-50 border border-gray-200 rounded-2xl">
        <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-600">You&apos;ve declined this quote. Feel free to contact us to discuss further.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Ready to proceed?</h2>
        <p className="text-sm text-gray-500 mb-5">
          Accept this quote to confirm your interest, or decline if this doesn't meet your requirements.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeclineOpen(true)}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading === "accept" ? "Accepting..." : "Accept Quote"}
          </button>
        </div>
      </div>

      {declineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Decline Quote</h3>
              <button onClick={() => setDeclineOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Help us improve by sharing why this quote doesn't work for you.</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Optional reason for declining..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setDeclineOpen(false)} className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!!loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {loading === "decline" ? "Declining..." : "Decline Quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
