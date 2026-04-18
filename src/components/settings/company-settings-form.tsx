"use client";

import { useState } from "react";
import { updateCompanySettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import { Loader2, Building2, MapPin, CreditCard, FileText } from "lucide-react";
import { CURRENCIES_LIST } from "@/lib/currency";

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

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bahrain","Bangladesh",
  "Belgium","Brazil","Cambodia","Canada","Chile","China","Colombia","Croatia","Cyprus",
  "Czech Republic","Denmark","Egypt","Estonia","Ethiopia","Finland","France","Germany",
  "Ghana","Greece","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Japan","Jordan","Kazakhstan","Kenya","Kuwait","Laos","Latvia","Lebanon","Lithuania",
  "Luxembourg","Malaysia","Maldives","Malta","Mexico","Morocco","Myanmar","Nepal",
  "Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Saudi Arabia","Singapore","Slovakia","Slovenia",
  "South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Taiwan",
  "Tanzania","Thailand","Turkey","UAE","Uganda","Ukraine","United Kingdom","United States",
  "Vietnam","Zimbabwe",
];

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-violet-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 bg-white transition-all";

const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-violet-100/60 card-glow p-6">
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

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
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* Agency Info */}
      <Section icon={Building2} title="Agency Information">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Agency / Company Name *</label>
              <input
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className={inputCls}
                placeholder="e.g. Horizon Travel LLC"
              />
            </div>
            <div>
              <label className={labelCls}>Logo URL</label>
              <input
                value={form.logoUrl}
                onChange={(e) => update("logoUrl", e.target.value)}
                className={inputCls}
                placeholder="https://yourdomain.com/logo.png"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Business Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputCls}
                placeholder="info@youragency.com"
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputCls}
                placeholder="+1 555 000 0000"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className={inputCls}
              placeholder="https://youragency.com"
            />
          </div>
        </div>
      </Section>

      {/* Address */}
      <Section icon={MapPin} title="Business Address">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Street Address</label>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className={inputCls}
              placeholder="Street address, building, suite"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>City</label>
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className={inputCls}
                placeholder="City"
              />
            </div>
            <div>
              <label className={labelCls}>State / Province</label>
              <input
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className={inputCls}
                placeholder="State / Province"
              />
            </div>
            <div>
              <label className={labelCls}>Postal / ZIP Code</label>
              <input
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value)}
                className={inputCls}
                placeholder="Postal code"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <select
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Currency & Invoice */}
      <Section icon={CreditCard} title="Currency & Billing">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Default Currency</label>
            <select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {CURRENCIES_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              All amounts across the CRM will display in this currency.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Invoice Number Prefix</label>
              <input
                value={form.invoicePrefix}
                onChange={(e) => update("invoicePrefix", e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder="INV"
              />
              <p className="text-xs text-gray-400 mt-1">
                Invoices will be numbered: {form.invoicePrefix || "INV"}-XXXXXXXX
              </p>
            </div>
            <div>
              <label className={labelCls}>Tax Registration Number</label>
              <input
                value={form.gstin}
                onChange={(e) => update("gstin", e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder="GSTIN / VAT / GST / EIN"
              />
              <p className="text-xs text-gray-400 mt-1">
                Shown on invoices (GSTIN for India, VAT for EU, etc.)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Secondary Tax ID</label>
              <input
                value={form.pan}
                onChange={(e) => update("pan", e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder="PAN / ABN / BN / Company No."
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Invoice Footer */}
      <Section icon={FileText} title="Invoice Footer">
        <div>
          <label className={labelCls}>Footer Text</label>
          <textarea
            value={form.invoiceFooter}
            onChange={(e) => update("invoiceFooter", e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Thank you for choosing us. All bookings are subject to our terms and conditions."
          />
          <p className="text-xs text-gray-400 mt-1">Printed at the bottom of every invoice.</p>
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
