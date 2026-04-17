"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDeal } from "@/lib/actions/deals";
import { TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function ConvertToDealButton({
  contactId,
  contactName,
}: {
  contactId: string;
  contactName: string;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: `${contactName} — Travel Package`,
    value: "",
    destination: "",
    travelDate: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const deal = await createDeal({
        title: form.title,
        value: form.value ? Number(form.value) : undefined,
        contactId,
        description: [
          form.destination ? `Destination: ${form.destination}` : "",
          form.travelDate ? `Travel Date: ${form.travelDate}` : "",
        ].filter(Boolean).join("\n") || undefined,
      });
      toast.success("Deal created");
      setShow(false);
      router.push(`/deals/${deal.id}`);
    } catch {
      toast.error("Failed to create deal");
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        title="Convert to Deal"
      >
        <TrendingUp className="w-3.5 h-3.5" />
        Convert
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Convert to Deal</h2>
            <p className="text-xs text-gray-500 mt-0.5">{contactName}</p>
          </div>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal Title <span className="text-red-500">*</span></label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Value</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Travel Date</label>
              <input
                type="month"
                value={form.travelDate}
                onChange={e => setForm({ ...form, travelDate: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination</label>
            <input
              value={form.destination}
              onChange={e => setForm({ ...form, destination: e.target.value })}
              placeholder="Dubai, Maldives, Bali..."
              className={inputCls}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
