"use client";

import { useState } from "react";
import { generateBookingShareLink } from "@/lib/actions/bookings";
import { toast } from "sonner";
import { Share2, Copy, Check } from "lucide-react";

export function ShareBookingButton({ bookingId, existingToken }: { bookingId: string; existingToken?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/b/${existingToken}`
      : null
  );
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleShare() {
    if (shareUrl) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      const url = await generateBookingShareLink(bookingId);
      setShareUrl(url);
      setShowModal(true);
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
      >
        <Share2 className="w-3.5 h-3.5" />
        {loading ? "Generating..." : "Share with Traveler"}
      </button>

      {showModal && shareUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">Share Booking Wallet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Send this link to your traveler. They can view their booking details, itinerary, payments, and documents — no login required.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 outline-none"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
