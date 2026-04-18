"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassengerCost } from "@/lib/actions/bookings";
import { toast } from "sonner";
import { Check, X, Pencil } from "lucide-react";
import { useFmt } from "@/components/currency-provider";

type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  individualCost: number;
};

export function PassengerCostBreakdown({
  passengers,
  currency,
  totalAmount,
}: {
  passengers: Passenger[];
  currency: string;
  totalAmount: number;
}) {
  const router = useRouter();
  const fmt = useFmt();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const passengerTotal = passengers.reduce((s, p) => s + (p.individualCost ?? 0), 0);
  const unallocated = totalAmount - passengerTotal;

  async function saveCost(id: string) {
    const cost = parseFloat(editValue);
    if (isNaN(cost) || cost < 0) {
      toast.error("Enter a valid cost");
      return;
    }
    try {
      await updatePassengerCost(id, cost);
      toast.success("Cost updated");
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update cost");
    }
  }

  if (passengers.length === 0) return null;

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Cost per Passenger</h4>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Total: <strong className="text-gray-900">{fmt(totalAmount)}</strong></span>
          <span>Allocated: <strong className="text-indigo-600">{fmt(passengerTotal)}</strong></span>
          <span className={unallocated !== 0 ? "text-amber-500 font-medium" : "text-green-600 font-medium"}>
            {unallocated > 0 ? `Unallocated: ${fmt(unallocated)}` : unallocated < 0 ? `Over by: ${fmt(Math.abs(unallocated))}` : "Fully allocated"}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        {passengers.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                {p.firstName[0]}{p.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-gray-400 capitalize">{p.type.toLowerCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editingId === p.id ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{currency}</span>
                    <input
                      type="number"
                      className="w-24 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveCost(p.id); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                    />
                  </div>
                  <button onClick={() => saveCost(p.id)} className="p-1 text-green-500 hover:text-green-600">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className={`text-sm font-semibold ${p.individualCost > 0 ? "text-gray-900" : "text-gray-300"}`}>
                    {p.individualCost > 0 ? fmt(p.individualCost) : "—"}
                  </span>
                  <button
                    onClick={() => { setEditingId(p.id); setEditValue(String(p.individualCost || "")); }}
                    className="p-1 text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit cost"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Progress bar showing allocation */}
      {totalAmount > 0 && (
        <div className="mt-3">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${passengerTotal > totalAmount ? "bg-red-400" : "bg-indigo-500"}`}
              style={{ width: `${Math.min((passengerTotal / totalAmount) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {Math.round((passengerTotal / totalAmount) * 100)}% allocated
          </p>
        </div>
      )}
    </div>
  );
}
