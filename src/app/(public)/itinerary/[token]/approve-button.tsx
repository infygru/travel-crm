"use client";

import { useState } from "react";
import { approveItinerary } from "@/lib/actions/itineraries";
import { CheckCircle2 } from "lucide-react";

interface ApproveButtonProps {
  shareToken: string;
}

export function ApproveButton({ shareToken }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await approveItinerary(shareToken);
      setApproved(true);
    } catch {
      alert("Failed to approve itinerary. Please try again.");
      setLoading(false);
    }
  }

  if (approved) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
        <CheckCircle2 className="w-5 h-5" />
        Itinerary Approved! Refreshing...
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-base font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
    >
      <CheckCircle2 className="w-5 h-5" />
      {loading ? "Approving..." : "Approve This Itinerary"}
    </button>
  );
}
