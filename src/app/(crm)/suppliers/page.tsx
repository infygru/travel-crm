import { getSuppliers } from "@/lib/actions/suppliers";
import { SUPPLIER_CATEGORY_LABELS, SUPPLIER_PAYMENT_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { Plus, Truck, Star } from "lucide-react";
import { NewSupplierDialog } from "@/components/suppliers/new-supplier-dialog";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { suppliers, total } = await getSuppliers({
    search: params.search,
    category: params.category,
    page: Number(params.page ?? 1),
  });

  const categories = Object.keys(SUPPLIER_CATEGORY_LABELS);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} vendor{total !== 1 ? "s" : ""} total</p>
        </div>
        <NewSupplierDialog />
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 mb-6">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search by name, contact, city..."
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {SUPPLIER_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Filter
        </button>
        {(params.search || params.category) && (
          <Link
            href="/suppliers"
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <Truck className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No suppliers yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first hotel, airline, or vendor.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] bg-gray-50 border-b border-gray-100">
            {["Supplier", "Category", "Contact", "City", "Rating", ""].map((h) => (
              <div key={h} className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </div>
            ))}
          </div>

          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
            >
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {supplier.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{supplier.name}</p>
                  {supplier.email && (
                    <p className="text-xs text-gray-400 truncate">{supplier.email}</p>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {SUPPLIER_CATEGORY_LABELS[supplier.category] ?? supplier.category}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className="text-sm text-gray-600">{supplier.contactName ?? "—"}</span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className="text-sm text-gray-600">
                  {[supplier.city, supplier.country].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center gap-1">
                {supplier.rating ? (
                  <>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-gray-700">{supplier.rating}/5</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
              <div className="px-2 py-3 flex items-center">
                <span className="text-xs text-gray-400 hover:text-indigo-600 font-medium">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
