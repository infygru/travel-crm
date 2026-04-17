"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createItinerary } from "@/lib/actions/itineraries";
import { importDaysFromPackage } from "@/lib/actions/itineraries";
import Link from "next/link";
import { Package, User, Calendar, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ContactOption = { id: string; firstName: string; lastName: string; email: string | null };
type PackageOption = { id: string; name: string; duration: number; currency: string; destinations: string[] };

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];

export function NewItineraryForm({
  contacts,
  packages,
  defaultContactId,
  defaultPackageId,
  defaultDealId,
  dealTitle,
}: {
  contacts: ContactOption[];
  packages: PackageOption[];
  defaultContactId: string;
  defaultPackageId: string;
  defaultDealId: string;
  dealTitle?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"idle" | "creating" | "importing" | "done">("idle");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(defaultContactId);
  const [selectedPackageId, setSelectedPackageId] = useState(defaultPackageId);

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  // Auto-fill title from contact + package
  const autoTitle = selectedContact && selectedPackage
    ? `${selectedContact.firstName} ${selectedContact.lastName} – ${selectedPackage.name}`
    : selectedContact
    ? `${selectedContact.firstName} ${selectedContact.lastName} – Itinerary`
    : selectedPackage
    ? selectedPackage.name
    : "";

  const [title, setTitle] = useState(autoTitle);
  const [startDate, setStartDate] = useState("");
  const [currency, setCurrency] = useState(selectedPackage?.currency ?? "INR");

  // Update title when contact/package changes (only if not manually edited)
  function handleContactChange(id: string) {
    setSelectedContactId(id);
    const c = contacts.find(x => x.id === id);
    const p = packages.find(x => x.id === selectedPackageId);
    if (c && p) setTitle(`${c.firstName} ${c.lastName} – ${p.name}`);
    else if (c) setTitle(`${c.firstName} ${c.lastName} – Itinerary`);
  }

  function handlePackageChange(id: string) {
    setSelectedPackageId(id);
    const p = packages.find(x => x.id === id);
    const c = contacts.find(x => x.id === selectedContactId);
    if (p) {
      setCurrency(p.currency);
      if (c) setTitle(`${c.firstName} ${c.lastName} – ${p.name}`);
      else setTitle(p.name);
    }
  }

  // Compute end date from start date + package duration
  const computedEndDate = startDate && selectedPackage
    ? (() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + selectedPackage.duration - 1);
        return d.toISOString().split("T")[0];
      })()
    : "";

  const filteredContacts = contactSearch.trim()
    ? contacts.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts.slice(0, 20);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContactId) {
      toast.error("Select a client first");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    setStep("creating");

    try {
      // Step 1: Create the itinerary
      const itinerary = await createItinerary({
        title: title.trim(),
        contactId: selectedContactId,
        dealId: defaultDealId || undefined,
        startDate: startDate || undefined,
        endDate: computedEndDate || undefined,
        currency,
      });

      // Step 2: If a package is selected, auto-import its days
      if (selectedPackageId) {
        setStep("importing");
        try {
          const result = await importDaysFromPackage(itinerary.id, selectedPackageId);
          toast.success(`Itinerary created with ${result.days} days from ${selectedPackage?.name}`);
        } catch {
          // Package has no days yet — that's fine, agent can add manually
          toast.success("Itinerary created — add days in the builder");
        }
      } else {
        toast.success("Itinerary created");
      }

      setStep("done");
      router.push(`/itineraries/${itinerary.id}`);
    } catch {
      toast.error("Failed to create itinerary");
      setSubmitting(false);
      setStep("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">

      {/* Step 1: Client */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">1</div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <User className="w-4 h-4 text-gray-400" /> Client
            <span className="text-red-500 ml-0.5">*</span>
          </h2>
        </div>

        {selectedContact ? (
          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-800">
                {selectedContact.firstName[0]}{selectedContact.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedContact.firstName} {selectedContact.lastName}</p>
                {selectedContact.email && <p className="text-xs text-gray-500">{selectedContact.email}</p>}
              </div>
            </div>
            {!defaultContactId && (
              <button type="button" onClick={() => { setSelectedContactId(""); setTitle(""); }} className="text-xs text-gray-400 hover:text-gray-600">
                Change
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <input
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              placeholder="Search client by name or email..."
              className={inputCls}
            />
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-400">No contacts found</p>
              ) : (
                filteredContacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleContactChange(c.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                      {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Package */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">2</div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-gray-400" /> Package Template
            <span className="text-xs text-gray-400 font-normal">(optional — days will be auto-imported)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => handlePackageChange("")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
              !selectedPackageId ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FileText className={`w-4 h-4 ${!selectedPackageId ? "text-indigo-600" : "text-gray-400"}`} />
            <div>
              <p className={`text-sm font-medium ${!selectedPackageId ? "text-indigo-700" : "text-gray-700"}`}>Custom / No Package</p>
              <p className="text-xs text-gray-400">Build the itinerary from scratch</p>
            </div>
          </button>
          {packages.map(pkg => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => handlePackageChange(pkg.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                selectedPackageId === pkg.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Package className={`w-4 h-4 flex-shrink-0 ${selectedPackageId === pkg.id ? "text-indigo-600" : "text-gray-400"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${selectedPackageId === pkg.id ? "text-indigo-700" : "text-gray-700"}`}>{pkg.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {pkg.duration} days
                  {pkg.destinations.length > 0 && ` · ${pkg.destinations.join(" → ")}`}
                  {` · ${pkg.currency}`}
                </p>
              </div>
              {selectedPackageId === pkg.id && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  Days auto-imported
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Dates + Title */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">3</div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" /> Travel Dates
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Departure Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Return Date</label>
            <input
              type="date"
              value={computedEndDate}
              onChange={() => {}}
              readOnly={!!computedEndDate}
              className={`${inputCls} ${computedEndDate ? "bg-gray-50 text-gray-500" : ""}`}
            />
            {computedEndDate && selectedPackage && (
              <p className="text-xs text-indigo-600 mt-1">Auto-calculated ({selectedPackage.duration} days)</p>
            )}
          </div>
        </div>
      </div>

      {/* Title + Currency */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Itinerary Title <span className="text-red-500">*</span></label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. John Smith – Dubai 5 Nights"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Link
          href={defaultDealId ? `/deals/${defaultDealId}?tab=itineraries` : "/itineraries"}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-70 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {step === "creating" ? "Creating itinerary..." : step === "importing" ? `Importing ${selectedPackage?.name} days...` : "Please wait..."}
            </>
          ) : (
            selectedPackageId
              ? `Create & Import ${selectedPackage?.duration} Days`
              : "Create Itinerary"
          )}
        </button>
      </div>
    </form>
  );
}
