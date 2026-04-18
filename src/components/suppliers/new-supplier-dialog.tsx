"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupplier } from "@/lib/actions/suppliers";
import { Plus, X } from "lucide-react";

const CATEGORIES = [
  "HOTEL", "AIRLINE", "TRANSFER", "ACTIVITY",
  "RESTAURANT", "VISA_AGENT", "INSURANCE", "CRUISE", "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  HOTEL: "Hotel", AIRLINE: "Airline", TRANSFER: "Transfer",
  ACTIVITY: "Activity", RESTAURANT: "Restaurant", VISA_AGENT: "Visa Agent",
  INSURANCE: "Insurance", CRUISE: "Cruise", OTHER: "Other",
};

export function NewSupplierDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const supplier = await createSupplier({
        name: fd.get("name") as string,
        category: fd.get("category") as string,
        email: (fd.get("email") as string) || undefined,
        phone: (fd.get("phone") as string) || undefined,
        website: (fd.get("website") as string) || undefined,
        country: (fd.get("country") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        contactName: (fd.get("contactName") as string) || undefined,
        contactEmail: (fd.get("contactEmail") as string) || undefined,
        contactPhone: (fd.get("contactPhone") as string) || undefined,
        paymentTerms: (fd.get("paymentTerms") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      setOpen(false);
      router.push(`/suppliers/${supplier.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create supplier");
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
        New Supplier
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Supplier</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Taj Hotels, IndiGo Airlines"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="supplier@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input
                    name="city"
                    placeholder="Mumbai"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                  <input
                    name="country"
                    placeholder="India"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Manager</label>
                  <input
                    name="contactName"
                    placeholder="Contact person name"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Manager Email</label>
                  <input
                    name="contactEmail"
                    type="email"
                    placeholder="manager@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                  <input
                    name="paymentTerms"
                    placeholder="e.g. Net 30 days, 50% advance"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Internal notes about this supplier..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Creating..." : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
