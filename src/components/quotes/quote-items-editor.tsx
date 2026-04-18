"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteItems } from "@/lib/actions/quotes";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

type QuoteItem = {
  id: string;
  order: number;
  description: string;
  type: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  notes?: string | null;
};

const ITEM_TYPES = ["FLIGHT", "HOTEL", "ACTIVITY", "TRANSFER", "VISA", "INSURANCE", "SERVICE", "OTHER"];

const TYPE_COLORS: Record<string, string> = {
  FLIGHT: "bg-sky-100 text-sky-700",
  HOTEL: "bg-amber-100 text-amber-700",
  ACTIVITY: "bg-green-100 text-green-700",
  TRANSFER: "bg-purple-100 text-purple-700",
  VISA: "bg-orange-100 text-orange-700",
  INSURANCE: "bg-pink-100 text-pink-700",
  SERVICE: "bg-indigo-100 text-indigo-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export function QuoteItemsEditor({
  quoteId,
  initialItems,
  currency,
  canEdit,
}: {
  quoteId: string;
  initialItems: QuoteItem[];
  currency: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<Omit<QuoteItem, "id">[]>(
    initialItems.map((i) => ({
      order: i.order,
      description: i.description,
      type: i.type,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount,
      totalPrice: i.totalPrice,
      notes: i.notes,
    }))
  );
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((s, item) => {
    const line = item.quantity * item.unitPrice;
    return s + line - line * (item.discount / 100);
  }, 0);

  function addItem() {
    setItems([...items, { order: items.length + 1, description: "", type: "SERVICE", quantity: 1, unitPrice: 0, discount: 0, totalPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof Omit<QuoteItem, "id" | "totalPrice">, value: string | number) {
    setItems(
      items.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        const line = updated.quantity * updated.unitPrice;
        updated.totalPrice = line - line * (updated.discount / 100);
        return updated;
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateQuoteItems(
        quoteId,
        items
          .filter((i) => i.description.trim())
          .map((i) => ({ ...i, notes: i.notes ?? undefined }))
      );
      toast.success("Items saved");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to save items");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setItems(
      initialItems.map((i) => ({
        order: i.order,
        description: i.description,
        type: i.type,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        totalPrice: i.totalPrice,
        notes: i.notes,
      }))
    );
    setEditing(false);
  }

  if (!editing) {
    return (
      <div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No items yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {item.type}
                  </span>
                  <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">×{item.quantity}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{item.totalPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </p>
                  {item.discount > 0 && (
                    <p className="text-xs text-green-600">{item.discount}% off</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Items
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-[2fr_1fr_80px_100px_60px_32px] bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 px-3 py-2 gap-2">
          <span>Description</span>
          <span>Type</span>
          <span>Qty</span>
          <span>Unit Price</span>
          <span>Disc %</span>
          <span />
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[2fr_1fr_80px_100px_60px_32px] gap-2 px-3 py-2 border-b border-gray-100 last:border-0 items-center">
            <input
              value={item.description}
              onChange={(e) => updateItem(idx, "description", e.target.value)}
              placeholder="Description"
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={item.type}
              onChange={(e) => updateItem(idx, "type", e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="number"
              value={item.quantity}
              min={1}
              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="number"
              value={item.unitPrice || ""}
              min={0}
              step="0.01"
              onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="number"
              value={item.discount || ""}
              min={0}
              max={100}
              onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="button" onClick={() => removeItem(idx)} className="p-1 text-gray-300 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
        <p className="text-sm font-semibold text-gray-900">
          Subtotal: ₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save Items"}
        </button>
      </div>
    </div>
  );
}
