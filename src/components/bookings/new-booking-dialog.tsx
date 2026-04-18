"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBooking } from "@/lib/actions/bookings"
import { Plus, X } from "lucide-react"
import { useFmt } from "@/components/currency-provider"

type ContactOption = { id: string; firstName: string; lastName: string; email: string | null }
type PackageOption = { id: string; name: string; basePrice: number; currency: string }

export function NewBookingDialog({
  contacts,
  packages,
}: {
  contacts: ContactOption[]
  packages: PackageOption[]
}) {
  const router = useRouter()
  const fmt = useFmt()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [contactSearch, setContactSearch] = useState("")
  const [selectedPackageId, setSelectedPackageId] = useState("")

  const filteredContacts = contactSearch
    ? contacts.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts.slice(0, 10)

  const selectedPkg = packages.find((p) => p.id === selectedPackageId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)

    try {
      const booking = await createBooking({
        startDate: fd.get("startDate") as string,
        endDate: fd.get("endDate") as string,
        adults: Number(fd.get("adults") || 1),
        children: Number(fd.get("children") || 0),
        totalAmount: Number(fd.get("totalAmount")),
        currency: fd.get("currency") as string || "INR",
        specialRequests: fd.get("specialRequests") as string || undefined,
        contactId: fd.get("contactId") as string || undefined,
        packageId: selectedPackageId || undefined,
      })
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      setSelectedPackageId("")
      setContactSearch("")
      router.push(`/bookings/${booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking")
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
        New Booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Booking</h2>
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

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact</label>
                <input
                  placeholder="Search contact by name or email..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-1"
                />
                {contactSearch && (
                  <select
                    name="contactId"
                    size={Math.min(filteredContacts.length + 1, 5)}
                    className="w-full px-3 py-1 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">— No contact —</option>
                    {filteredContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}{c.email ? ` (${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {!contactSearch && (
                  <select
                    name="contactId"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">— Select contact —</option>
                    {contacts.slice(0, 50).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}{c.email ? ` (${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Package */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Package</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => {
                    setSelectedPackageId(e.target.value)
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">— Custom Trip (no package) —</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {fmt(p.basePrice)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Pax */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adults</label>
                  <input
                    name="adults"
                    type="number"
                    defaultValue={1}
                    min={1}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Children</label>
                  <input
                    name="children"
                    type="number"
                    defaultValue={0}
                    min={0}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="totalAmount"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    defaultValue={selectedPkg?.basePrice ?? ""}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select
                    name="currency"
                    defaultValue={selectedPkg?.currency ?? "INR"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requests</label>
                <textarea
                  name="specialRequests"
                  rows={2}
                  placeholder="Dietary, accessibility, or other requirements..."
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
                  {submitting ? "Creating..." : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
