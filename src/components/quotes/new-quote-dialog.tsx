"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuote } from "@/lib/actions/quotes";
import { Plus, X, Trash2 } from "lucide-react";
import { useFmt } from "@/components/currency-provider";

type ContactOption = { id: string; firstName: string; lastName: string; email: string | null };
type DealOption = { id: string; title: string };

type LineItem = {
  description: string;
  type: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

const ITEM_TYPES = ["FLIGHT", "HOTEL", "ACTIVITY", "TRANSFER", "VISA", "INSURANCE", "SERVICE", "OTHER"];

export function NewQuoteDialog({
  contacts,
  deals,
}: {
  contacts: ContactOption[];
  deals: DealOption[];
}) {
  const router = useRouter();
  const fmt = useFmt();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", type: "SERVICE", quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  const filteredContacts = contactSearch
    ? contacts.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts.slice(0, 10);

  const subtotal = items.reduce((s, item) => {
    const line = item.quantity * item.unitPrice;
    return s + line - line * (item.discount / 100);
  }, 0);

  function addItem() {
    setItems([...items, { description: "", type: "SERVICE", quantity: 1, unitPrice: 0, discount: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    try {
      const quote = await createQuote({
        title: fd.get("title") as string,
        contactId: (fd.get("contactId") as string) || undefined,
        dealId: (fd.get("dealId") as string) || undefined,
        currency: (fd.get("currency") as string) || "INR",
        validUntil: (fd.get("validUntil") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
        terms: (fd.get("terms") as string) || undefined,
        items: items
          .filter((item) => item.description.trim())
          .map((item) => ({
            description: item.description,
            type: item.type,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
      });
      setOpen(false);
      router.push(`/quotes/${quote.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote");
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Quote
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Quote / Proposal</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quote Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Maldives Honeymoon Package - 7 Nights"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact</label>
                  <input
                    placeholder="Search contact..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-1"
                  />
                  <select
                    name="contactId"
                    size={Math.min(filteredContacts.length + 1, 5)}
                    className="w-full px-2 py-1 text-sm border border-indigo-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="">— No contact —</option>
                    {filteredContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}{c.email ? ` (${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal (optional)</label>
                  <select
                    name="dealId"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">— No deal —</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select name="currency" defaultValue="INR" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid Until</label>
                  <input
                    name="validUntil"
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
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
                        placeholder="e.g. Hotel stay - 3 nights"
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
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Subtotal: {fmt(subtotal, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes for Client</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Thank you for your interest in traveling with us..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms & Conditions</label>
                <textarea
                  name="terms"
                  rows={2}
                  placeholder="Cancellation policy, payment terms..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? "Creating..." : "Create Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
