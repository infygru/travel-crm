"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/actions/bookings";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useFmt } from "@/components/currency-provider";

type ContactOption = { id: string; firstName: string; lastName: string; email: string | null };
type PackageOption = { id: string; name: string; basePrice: number; currency: string; duration: number; destinations: string[] };
type PreContact = { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } | null;

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

export function NewBookingForm({
  contacts,
  packages,
  defaultContactId,
  defaultPackageId,
  dealId,
  preContact,
}: {
  contacts: ContactOption[];
  packages: PackageOption[];
  defaultContactId?: string;
  defaultPackageId?: string;
  dealId?: string;
  preContact: PreContact;
}) {
  const router = useRouter();
  const fmt = useFmt();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contactSearch, setContactSearch] = useState(
    preContact ? `${preContact.firstName} ${preContact.lastName}` : ""
  );
  const [selectedContactId, setSelectedContactId] = useState(defaultContactId ?? "");
  const [selectedPackageId, setSelectedPackageId] = useState(defaultPackageId ?? "");

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  const filteredContacts = contactSearch
    ? contacts.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts.slice(0, 15);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    if (!selectedContactId) {
      setError("Please select a customer for this booking");
      setSubmitting(false);
      return;
    }

    try {
      const booking = await createBooking({
        startDate: fd.get("startDate") as string,
        endDate: fd.get("endDate") as string,
        adults: Number(fd.get("adults") || 1),
        children: Number(fd.get("children") || 0),
        infants: Number(fd.get("infants") || 0),
        totalAmount: Number(fd.get("totalAmount")),
        currency: fd.get("currency") as string || "INR",
        destinations: (fd.get("destinations") as string || "").split(",").map((s) => s.trim()).filter(Boolean),
        specialRequests: (fd.get("specialRequests") as string) || undefined,
        internalNotes: (fd.get("internalNotes") as string) || undefined,
        contactId: selectedContactId || undefined,
        packageId: selectedPackageId || undefined,
        dealId: dealId || undefined,
      });
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link href={dealId ? `/deals/${dealId}?tab=bookings` : "/bookings"} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        {dealId ? "Back to Deal" : "Back to Bookings"}
      </Link>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {dealId && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700">
            This booking will be linked to the deal.
          </div>
        )}

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Customer <span className="text-red-500">*</span>
          <span className="text-xs text-gray-400 font-normal ml-1">— who is this booking for?</span>
        </label>
          {preContact ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                {preContact.firstName[0]}{preContact.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{preContact.firstName} {preContact.lastName}</p>
                {preContact.email && <p className="text-xs text-gray-500">{preContact.email}</p>}
                {preContact.phone && <p className="text-xs text-gray-500">{preContact.phone}</p>}
              </div>
            </div>
          ) : (
            <>
              <input
                placeholder="Search contact by name or email..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className={`${inputCls} mb-1.5`}
              />
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className={inputCls}
                size={Math.min(filteredContacts.length + 1, 6)}
              >
                <option value="">— No contact —</option>
                {filteredContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}{c.email ? ` (${c.email})` : ""}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Package */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Package</label>
          <select
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Custom Trip (no package) —</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {fmt(p.basePrice)}
                {p.destinations.length > 0 ? ` · ${p.destinations.slice(0, 2).join(", ")}` : ""}
              </option>
            ))}
          </select>
          {selectedPkg && (
            <p className="text-xs text-indigo-600 mt-1">{selectedPkg.duration} days · {selectedPkg.destinations.join(", ")}</p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
            <input name="startDate" type="date" required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
            <input name="endDate" type="date" required className={inputCls} />
          </div>
        </div>

        {/* Destinations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Destinations</label>
          <input
            name="destinations"
            defaultValue={selectedPkg?.destinations.join(", ") ?? ""}
            placeholder="Paris, Rome, Barcelona (comma separated)"
            className={inputCls}
          />
        </div>

        {/* Pax */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adults</label>
            <input name="adults" type="number" defaultValue={1} min={1} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Children</label>
            <input name="children" type="number" defaultValue={0} min={0} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Infants</label>
            <input name="infants" type="number" defaultValue={0} min={0} className={inputCls} />
          </div>
        </div>

        {/* Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Amount <span className="text-red-500">*</span></label>
            <input
              name="totalAmount"
              type="number"
              required
              min={0}
              step="0.01"
              defaultValue={selectedPkg?.basePrice ?? ""}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <select name="currency" defaultValue={selectedPkg?.currency ?? "INR"} className={inputCls}>
              {["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requests</label>
          <textarea
            name="specialRequests"
            rows={2}
            placeholder="Dietary, accessibility, or other requirements..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal Notes</label>
          <textarea
            name="internalNotes"
            rows={2}
            placeholder="Notes visible only to agents..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href={dealId ? `/deals/${dealId}?tab=bookings` : "/bookings"}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
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
  );
}
