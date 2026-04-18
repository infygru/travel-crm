"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendQuote, deleteQuote, createBookingFromQuote } from "@/lib/actions/quotes";
import { toast } from "sonner";
import { Send, Copy, Trash2, MoreHorizontal, X, ExternalLink, CalendarCheck } from "lucide-react";

type Quote = {
  id: string;
  status: string;
  quoteNumber: string;
  contact?: { email?: string | null; firstName: string; lastName: string } | null;
};

export function QuoteActions({
  quote,
  shareUrl,
}: {
  quote: Quote;
  shareUrl: string | null;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      await sendQuote(quote.id);
      toast.success("Quote marked as sent");
      setConfirmSend(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete quote ${quote.quoteNumber}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteQuote(quote.id);
      toast.success("Quote deleted");
      router.push("/quotes");
    } catch {
      toast.error("Failed to delete quote");
      setLoading(false);
    }
  }

  function copyShareLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {shareUrl && (
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        )}

        {quote.status === "DRAFT" && (
          <button
            onClick={() => setConfirmSend(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send to Client
          </button>
        )}

        {quote.status === "ACCEPTED" && (
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const booking = await createBookingFromQuote(quote.id);
                toast.success("Booking created from quote");
                router.push(`/bookings/${booking.id}`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to create booking");
                setLoading(false);
              }
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CalendarCheck className="w-4 h-4" />
            {loading ? "Creating..." : "Create Booking"}
          </button>
        )}

        {shareUrl && (
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </a>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); handleDelete(); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Quote
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Send confirm dialog */}
      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Send Quote to Client</h3>
              <button onClick={() => setConfirmSend(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              This will mark the quote as <strong>Sent</strong> and generate a shareable link.
            </p>
            {quote.contact?.email && (
              <p className="text-sm text-gray-500 mb-4">
                Client email: <strong>{quote.contact.email}</strong>
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSend(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Mark as Sent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
