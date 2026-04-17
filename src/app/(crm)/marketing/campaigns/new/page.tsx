"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/actions/marketing";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Details", "Audience", "Content", "Schedule"];

const CHANNELS = [
  { value: "EMAIL", label: "Email", icon: "📧" },
  { value: "SMS", label: "SMS", icon: "💬" },
  { value: "WHATSAPP", label: "WhatsApp", icon: "📱" },
];

const TYPES = [
  { value: "BROADCAST", label: "Broadcast", desc: "Send to all contacts at once" },
  { value: "DRIP", label: "Drip", desc: "Automated series of messages over time" },
  { value: "TRANSACTIONAL", label: "Transactional", desc: "Triggered by a specific event" },
];

const EMPTY_FORM = {
  name: "",
  channel: "EMAIL",
  type: "BROADCAST",
  segmentId: "",
  subject: "",
  body: "",
  fromName: "",
  fromEmail: "",
  replyTo: "",
  scheduleType: "now",
  scheduledAt: "",
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function nextStep() {
    if (step === 0 && !form.name) { toast.error("Campaign name is required"); return; }
    if (step === 2 && !form.body) { toast.error("Message body is required"); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    if (!form.name || !form.body) {
      toast.error("Name and body are required");
      return;
    }
    setSaving(true);
    try {
      const scheduledAt = form.scheduleType === "later" && form.scheduledAt
        ? form.scheduledAt
        : undefined;
      const status = scheduledAt ? "SCHEDULED" : "DRAFT";
      const campaign = await createCampaign({
        name: form.name,
        channel: form.channel,
        type: form.type,
        status,
        scheduledAt,
        subject: form.channel === "EMAIL" ? form.subject : undefined,
        body: form.body,
        fromName: form.fromName || undefined,
        fromEmail: form.fromEmail || undefined,
        replyTo: form.replyTo || undefined,
        segmentId: form.segmentId || undefined,
      });
      toast.success("Campaign created!");
      router.push("/marketing/campaigns");
    } catch {
      toast.error("Failed to create campaign");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/marketing/campaigns" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900">New Campaign</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new marketing campaign</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
              i < step ? "bg-indigo-600 text-white"
              : i === step ? "bg-indigo-600 text-white ring-2 ring-indigo-200"
              : "bg-gray-100 text-gray-400"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? "text-indigo-600" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Step 1: Details */}
        {step === 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-900">Campaign Details</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Campaign Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Summer Sale – Email Blast"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, channel: c.value })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                      form.channel === c.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Campaign Type</label>
              <div className="space-y-2">
                {TYPES.map((t) => (
                  <label
                    key={t.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.type === t.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t.value}
                      checked={form.type === t.value}
                      onChange={() => setForm({ ...form, type: t.value })}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Audience */}
        {step === 1 && (
          <>
            <h2 className="text-sm font-semibold text-gray-900">Select Audience</h2>
            <div className="space-y-3">
              {[
                {
                  value: "all",
                  label: "All Active Contacts",
                  desc: "Send to every active contact in your CRM",
                  icon: "👥",
                },
                {
                  value: "new",
                  label: "New Leads",
                  desc: "Contacts with status: New",
                  icon: "🌱",
                },
                {
                  value: "qualified",
                  label: "Qualified Leads",
                  desc: "Contacts with status: Qualified or Proposal Sent",
                  icon: "⭐",
                },
                {
                  value: "converted",
                  label: "Existing Customers",
                  desc: "Contacts who have converted or have confirmed bookings",
                  icon: "✅",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    form.segmentId === opt.value || (opt.value === "all" && !form.segmentId)
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    value={opt.value}
                    checked={opt.value === "all" ? !form.segmentId : form.segmentId === opt.value}
                    onChange={() => setForm({ ...form, segmentId: opt.value === "all" ? "" : opt.value })}
                    className="mt-1"
                  />
                  <div className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> The actual recipients are determined when the campaign is sent. Make sure your contact list is up to date before sending.
              </p>
            </div>
          </>
        )}

        {/* Step 3: Content */}
        {step === 2 && (
          <>
            <h2 className="text-sm font-semibold text-gray-900">Message Content</h2>
            {form.channel === "EMAIL" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject Line *</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. ✈️ Exclusive Summer Travel Deals Inside"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From Name</label>
                    <input
                      type="text"
                      value={form.fromName}
                      onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                      placeholder="Travel CRM"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From Email</label>
                    <input
                      type="email"
                      value={form.fromEmail}
                      onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                      placeholder="noreply@example.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reply-To</label>
                  <input
                    type="email"
                    value={form.replyTo}
                    onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                    placeholder="support@example.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Message Body *
                {form.channel !== "EMAIL" && (
                  <span className="text-gray-400 ml-1">
                    ({form.channel === "SMS" ? "max 160 chars" : "WhatsApp message"})
                  </span>
                )}
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={form.channel === "EMAIL" ? 8 : 4}
                placeholder={
                  form.channel === "EMAIL"
                    ? "Write your email body here. You can use {{firstName}}, {{lastName}} as variables."
                    : form.channel === "SMS"
                    ? "Hi {{firstName}}, exciting travel deals await you..."
                    : "Hello {{firstName}}! We have a special offer for you..."
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
              />
              {form.channel === "SMS" && (
                <p className="text-xs text-gray-400 mt-1">{form.body.length}/160 characters</p>
              )}
            </div>
          </>
        )}

        {/* Step 4: Schedule */}
        {step === 3 && (
          <>
            <h2 className="text-sm font-semibold text-gray-900">Schedule Campaign</h2>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                form.scheduleType === "now" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input
                  type="radio"
                  name="scheduleType"
                  value="now"
                  checked={form.scheduleType === "now"}
                  onChange={() => setForm({ ...form, scheduleType: "now" })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Save as Draft</p>
                  <p className="text-xs text-gray-500">Save the campaign and send later manually</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                form.scheduleType === "later" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input
                  type="radio"
                  name="scheduleType"
                  value="later"
                  checked={form.scheduleType === "later"}
                  onChange={() => setForm({ ...form, scheduleType: "later" })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Schedule for Later</p>
                  <p className="text-xs text-gray-500">Choose a specific date and time to send</p>
                </div>
              </label>
            </div>
            {form.scheduleType === "later" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Send Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Summary</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-gray-500">Name:</span><span className="text-gray-900 font-medium">{form.name}</span>
                <span className="text-gray-500">Channel:</span><span className="text-gray-900">{form.channel}</span>
                <span className="text-gray-500">Type:</span><span className="text-gray-900">{form.type}</span>
                {form.channel === "EMAIL" && form.subject && (
                  <><span className="text-gray-500">Subject:</span><span className="text-gray-900 truncate">{form.subject}</span></>
                )}
                <span className="text-gray-500">Audience:</span>
                <span className="text-gray-900">{form.segmentId ? "Specific segment" : "All contacts"}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {saving ? "Creating..." : "Create Campaign"}
          </button>
        )}
      </div>
    </div>
  );
}
