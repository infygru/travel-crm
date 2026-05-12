"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createVisaApplication } from "@/lib/actions/visa";
import { VISA_TYPE_LABELS } from "@/lib/constants";
import { Plus } from "lucide-react";

type Contact = { id: string; firstName: string; lastName: string; email: string | null };
type Agent = { id: string; name: string | null; email: string };

export function NewVisaDialog({
  contacts,
  agents,
  defaultContactId,
  defaultBookingId,
}: {
  contacts: Contact[];
  agents: Agent[];
  defaultContactId?: string;
  defaultBookingId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    contactId: defaultContactId ?? "",
    bookingId: defaultBookingId ?? "",
    agentId: "",
    visaType: "SCHENGEN",
    destinationCountry: "",
    embassyCenter: "",
    travelDate: "",
    priority: "MEDIUM",
    notes: "",
  });

  const COUNTRY_DEFAULTS: Record<string, string> = {
    SCHENGEN: "Europe",
    UK: "United Kingdom",
    USA: "United States",
    CANADA: "Canada",
    AUSTRALIA: "Australia",
    DUBAI_UAE: "UAE",
    SINGAPORE: "Singapore",
    JAPAN: "Japan",
    CHINA: "China",
    NEW_ZEALAND: "New Zealand",
  };

  function handleVisaTypeChange(type: string) {
    setForm((f) => ({
      ...f,
      visaType: type,
      destinationCountry: COUNTRY_DEFAULTS[type] ?? f.destinationCountry,
    }));
  }

  function handleSubmit() {
    if (!form.contactId) return toast.error("Select a contact");
    if (!form.destinationCountry) return toast.error("Enter destination country");

    startTransition(async () => {
      try {
        const visa = await createVisaApplication({
          contactId: form.contactId,
          bookingId: form.bookingId || undefined,
          agentId: form.agentId || undefined,
          visaType: form.visaType as never,
          destinationCountry: form.destinationCountry,
          embassyCenter: form.embassyCenter || undefined,
          travelDate: form.travelDate || undefined,
          priority: form.priority as never,
          notes: form.notes || undefined,
        });
        toast.success("Visa application created with document checklist");
        setOpen(false);
        router.push(`/visa/${visa.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        <Plus className="w-4 h-4" />
        New Visa Application
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Visa Application</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                A document checklist will be auto-generated based on visa type.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Contact */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Applicant *</label>
                <select
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select contact…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}{c.email ? ` · ${c.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visa Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Visa Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(VISA_TYPE_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleVisaTypeChange(k)}
                      className={`px-3 py-2 text-xs rounded-lg border text-center transition-all ${
                        form.visaType === k
                          ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Destination */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Destination Country *</label>
                  <input
                    value={form.destinationCountry}
                    onChange={(e) => setForm({ ...form, destinationCountry: e.target.value })}
                    placeholder="e.g. France"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Travel Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={form.travelDate}
                    onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Embassy / Center */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Embassy / Processing Center</label>
                <input
                  value={form.embassyCenter}
                  onChange={(e) => setForm({ ...form, embassyCenter: e.target.value })}
                  placeholder="e.g. VFS Global Chennai, TLScontact Mumbai"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Agent */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assign Agent</label>
                  <select
                    value={form.agentId}
                    onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Any special requirements or notes…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? "Creating…" : "Create Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
