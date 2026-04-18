"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSupplier, deleteSupplier, addSupplierPayment, updateSupplierPaymentStatus } from "@/lib/actions/suppliers";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Plus, X, Check } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  isActive: boolean;
  paymentTerms?: string | null;
  notes?: string | null;
  rating?: number | null;
};

export function SupplierActions({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteSupplier(supplier.id);
      toast.success("Supplier deleted");
      router.push("/suppliers");
    } catch {
      toast.error("Failed to delete supplier");
      setLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateSupplier(supplier.id, {
        notes: (fd.get("notes") as string) || undefined,
        paymentTerms: (fd.get("paymentTerms") as string) || undefined,
        rating: fd.get("rating") ? Number(fd.get("rating")) : undefined,
        isActive: fd.get("isActive") === "true",
      });
      toast.success("Supplier updated");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to update supplier");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await addSupplierPayment({
        supplierId: supplier.id,
        amount: Number(fd.get("amount")),
        currency: (fd.get("currency") as string) || "INR",
        dueDate: (fd.get("dueDate") as string) || undefined,
        status: (fd.get("status") as string) || "PENDING",
        reference: (fd.get("reference") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      toast.success("Payment recorded");
      setPaymentOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPaymentOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Payment
        </button>
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
                  onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  Edit Details
                </button>
                <button
                  onClick={() => { setMenuOpen(false); handleDelete(); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Edit Supplier</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating (1–5)</label>
                <select
                  name="rating"
                  defaultValue={supplier.rating ?? ""}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">No rating</option>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                <input
                  name="paymentTerms"
                  defaultValue={supplier.paymentTerms ?? ""}
                  placeholder="e.g. Net 30, 50% advance"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  name="isActive"
                  defaultValue={supplier.isActive ? "true" : "false"}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={supplier.notes ?? ""}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Dialog */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Record Payment</h3>
              <button onClick={() => setPaymentOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
                <input
                  name="amount"
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select name="status" defaultValue="PENDING" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <input name="dueDate" type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference</label>
                <input name="reference" placeholder="Invoice #, PO number..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <input name="notes" placeholder="Optional notes..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPaymentOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
