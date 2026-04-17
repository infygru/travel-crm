"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPackage } from "@/lib/actions/packages"
import { Plus, X } from "lucide-react"

const CATEGORIES = [
  "ADVENTURE", "LUXURY", "FAMILY", "HONEYMOON", "BUSINESS",
  "GROUP_TOUR", "CRUISE", "SAFARI", "BEACH", "CULTURAL", "PILGRIMAGE", "SPORTS", "OTHER",
]

export function NewPackageDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)

    try {
      await createPackage({
        name: fd.get("name") as string,
        code: fd.get("code") as string || undefined,
        description: fd.get("description") as string || undefined,
        category: fd.get("category") as string,
        duration: Number(fd.get("duration")),
        basePrice: Number(fd.get("basePrice")),
        currency: fd.get("currency") as string || "INR",
        maxPax: fd.get("maxPax") ? Number(fd.get("maxPax")) : undefined,
        destinations: (fd.get("destinations") as string)
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        imageUrl: fd.get("imageUrl") as string || undefined,
      })
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create package")
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Package
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Travel Package</h2>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Bali Paradise 7D/6N"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Code</label>
                  <input
                    name="code"
                    placeholder="e.g. BALI-7D"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  required
                  defaultValue="OTHER"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destinations</label>
                <input
                  name="destinations"
                  placeholder="Bali, Ubud, Seminyak (comma separated)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="duration"
                    type="number"
                    required
                    min={1}
                    placeholder="7"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Pax</label>
                  <input
                    name="maxPax"
                    type="number"
                    min={1}
                    placeholder="20"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Base Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="basePrice"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    placeholder="1500.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select
                    name="currency"
                    defaultValue="INR"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="AED">AED</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Image URL</label>
                <input
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-400">Cover image shown on package cards and PDF brochure</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Package overview..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
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
                  {submitting ? "Creating..." : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
