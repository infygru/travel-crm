"use client";

import { useState, useEffect } from "react";
import { getForms, createForm, updateForm } from "@/lib/actions/leads";
import { ArrowLeft, Plus, ToggleLeft, ToggleRight, Copy, Check, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

type WebLeadForm = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  fields: unknown;
  defaultTags: string[];
  embedToken: string;
  isActive: boolean;
  submissionCount: number;
  createdAt: Date;
  _count: { submissions: number };
};

const FIELD_OPTIONS = [
  { key: "firstName", label: "First Name", type: "text", required: true },
  { key: "lastName", label: "Last Name", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Phone", type: "tel", required: false },
  { key: "message", label: "Message", type: "textarea", required: false },
];

const SOURCE_OPTIONS = [
  { value: "", label: "None" },
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "ADVERTISEMENT", label: "Advertisement" },
  { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
  name: "",
  title: "",
  description: "",
  enabledFields: ["firstName", "lastName", "email", "phone", "message"],
  defaultSource: "",
};

export default function WebFormsPage() {
  const [forms, setForms] = useState<WebLeadForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadForms() {
    setLoading(true);
    try {
      const data = await getForms();
      setForms(data as WebLeadForm[]);
    } catch {
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadForms(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }

    setSaving(true);
    try {
      const fields = FIELD_OPTIONS.filter((f) => form.enabledFields.includes(f.key));
      await createForm({
        name: form.name,
        title: form.title || undefined,
        description: form.description || undefined,
        fields,
        defaultSource: form.defaultSource || undefined,
      });
      toast.success("Form created");
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadForms();
    } catch {
      toast.error("Failed to create form");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(f: WebLeadForm) {
    try {
      await updateForm(f.id, { isActive: !f.isActive });
      toast.success(`Form ${f.isActive ? "deactivated" : "activated"}`);
      await loadForms();
    } catch {
      toast.error("Failed to update form");
    }
  }

  function toggleField(key: string) {
    setForm((prev) => ({
      ...prev,
      enabledFields: prev.enabledFields.includes(key)
        ? prev.enabledFields.filter((k) => k !== key)
        : [...prev.enabledFields, key],
    }));
  }

  async function copyEmbedCode(embedToken: string) {
    const url = `${window.location.origin}/forms/${embedToken}`;
    const code = `<iframe src="${url}" width="100%" height="600" frameborder="0" style="border:none;"></iframe>`;
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(embedToken);
    toast.success("Embed code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/leads" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Web Lead Forms</h1>
            <p className="text-sm text-gray-500">Embed forms on your website to capture leads</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Form
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Create New Form</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Form Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Contact Page Form"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Form Title (displayed to users)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Get in Touch"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Fields to Include</label>
            <div className="flex flex-wrap gap-2">
              {FIELD_OPTIONS.map((f) => (
                <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enabledFields.includes(f.key)}
                    onChange={() => toggleField(f.key)}
                    disabled={f.required}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{f.label}</span>
                  {f.required && <span className="text-xs text-gray-400">(required)</span>}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Default Lead Source</label>
            <select
              value={form.defaultSource}
              onChange={(e) => setForm({ ...form, defaultSource: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Form"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">Loading...</div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Globe className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No forms yet. Create your first web-to-lead form.</p>
          </div>
        ) : (
          forms.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{f.name}</h3>
                    {!f.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  {f.title && <p className="text-xs text-gray-500 mt-0.5">{f.title}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{f._count.submissions} submissions</span>
                    <span className="text-xs text-gray-400">
                      Created {format(new Date(f.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(f)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    {f.isActive ? (
                      <ToggleRight className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <a
                    href={`/forms/${f.embedToken}`}
                    target="_blank"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50"
                  >
                    Preview
                  </a>
                </div>
              </div>

              {/* Embed code */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-2">Embed Code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 font-mono truncate">
                    {`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/forms/${f.embedToken}" width="100%" height="600" frameborder="0"></iframe>`}
                  </code>
                  <button
                    onClick={() => copyEmbedCode(f.embedToken)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex-shrink-0 transition-colors"
                  >
                    {copiedId === f.embedToken ? (
                      <><Check className="w-3.5 h-3.5 text-green-500" />Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" />Copy</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
