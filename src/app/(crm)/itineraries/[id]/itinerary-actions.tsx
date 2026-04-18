"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertItineraryToBooking } from "@/lib/actions/itineraries";
import { toast } from "sonner";
import { CalendarCheck, Loader2 } from "lucide-react";

export function ConvertToBookingButton({
  itineraryId,
  status,
  totalCost,
}: {
  itineraryId: string;
  status: string;
  totalCost: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (status === "BOOKED") {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
        <CalendarCheck className="w-4 h-4" />
        Booking Created
      </span>
    );
  }

  async function handleConvert() {
    setLoading(true);
    try {
      const booking = await convertItineraryToBooking(itineraryId);
      toast.success("Booking created from itinerary");
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
      setLoading(false);
      setConfirm(false);
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        <CalendarCheck className="w-4 h-4" />
        Convert to Booking
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
      <span className="text-xs text-green-700 font-medium">
        Create booking for ₹{totalCost.toLocaleString("en-IN")}?
      </span>
      <button
        onClick={handleConvert}
        disabled={loading}
        className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        Yes, create
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>
    </div>
  );
}
