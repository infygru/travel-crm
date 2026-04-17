"use client";

import { useState } from "react";
import { updateCompanySettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type CompanySettings = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  gstin: string | null;
  pan: string | null;
  invoicePrefix: string;
  invoiceFooter: string | null;
  currency: string;
};

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function CompanySettingsForm({ settings }: { settings: CompanySettings }) {
  const [form, setForm] = useState({
    companyName: settings.companyName,
    logoUrl: settings.logoUrl ?? "",
    address: settings.address ?? "",
    city: settings.city ?? "",
    state: settings.state ?? "",
    pincode: settings.pincode ?? "",
    country: settings.country,
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    website: settings.website ?? "",
    gstin: settings.gstin ?? "",
    pan: settings.pan ?? "",
    invoicePrefix: settings.invoicePrefix,
    invoiceFooter: settings.invoiceFooter ?? "",
    currency: settings.currency,
  });
  const [saving, setSaving] = useState(false);

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      await updateCompanySettings({
        companyName: form.companyName,
        logoUrl: form.logoUrl || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        country: form.country || "India",
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        gstin: form.gstin || undefined,
        pan: form.pan || undefined,
        invoicePrefix: form.invoicePrefix || "INV",
        invoiceFooter: form.invoiceFooter || undefined,
        currency: form.currency || "INR",
      });
      toast.success("Company settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Agency Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company / Agency Name *</label>
              <input value={form.companyName} onChange={e => update("companyName", e.target.value)} className={inputCls} placeholder="e.g. Horizon Travel Pvt Ltd" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
              <input value={form.logoUrl} onChange={e => update("logoUrl", e.target.value)} className={inputCls} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Business Email</label>
              <input type="email" value={form.email} onChange={e => update("email", e.target.value)} className={inputCls} placeholder="info@youragency.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e => update("phone", e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
            <input value={form.website} onChange={e => update("website", e.target.value)} className={inputCls} placeholder="https://youragency.com" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Address</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
            <input value={form.address} onChange={e => update("address", e.target.value)} className={inputCls} placeholder="123 MG Road" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input value={form.city} onChange={e => update("city", e.target.value)} className={inputCls} placeholder="Mumbai" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <input value={form.state} onChange={e => update("state", e.target.value)} className={inputCls} placeholder="Maharashtra" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
              <input value={form.pincode} onChange={e => update("pincode", e.target.value)} className={inputCls} placeholder="400001" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <input value={form.country} onChange={e => update("country", e.target.value)} className={inputCls} placeholder="India" />
          </div>
        </div>
      </div>

      {/* Tax & Invoice */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Tax &amp; Invoice Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
              <input value={form.gstin} onChange={e => update("gstin", e.target.value)} className={`${inputCls} font-mono`} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PAN</label>
              <input value={form.pan} onChange={e => update("pan", e.target.value)} className={`${inputCls} font-mono`} placeholder="AAAAA0000A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Number Prefix</label>
              <input value={form.invoicePrefix} onChange={e => update("invoicePrefix", e.target.value)} className={`${inputCls} font-mono`} placeholder="INV" />
              <p className="text-xs text-gray-400 mt-1">Invoices will appear as {form.invoicePrefix || "INV"}-XXXXXXXX</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Currency</label>
              <select value={form.currency} onChange={e => update("currency", e.target.value)} className={`${inputCls} bg-white`}>
                {["INR","USD","EUR","GBP","AED","SGD","AUD"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Footer Text</label>
            <textarea value={form.invoiceFooter} onChange={e => update("invoiceFooter", e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Thank you for choosing us. All payments are non-refundable as per booking terms." />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
