"use client";

import { useState, useEffect } from "react";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/lib/actions/marketing";
import { FileText, Plus, Edit2, Trash2, ArrowLeft, X, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

type Template = {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  createdBy: { id: string; name: string | null } | null;
};

const CHANNELS = [
  { value: "EMAIL", label: "Email", icon: "📧", color: "bg-blue-100 text-blue-700" },
  { value: "SMS", label: "SMS", icon: "💬", color: "bg-green-100 text-green-700" },
  { value: "WHATSAPP", label: "WhatsApp", icon: "📱", color: "bg-emerald-100 text-emerald-700" },
];

const EMPTY_FORM = {
  name: "",
  channel: "EMAIL",
  subject: "",
  body: "",
  variables: "",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterChannel, setFilterChannel] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await getTemplates({ channel: filterChannel || undefined });
      setTemplates(data as Template[]);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTemplates(); }, [filterChannel]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.body) { toast.error("Name and body are required"); return; }
    setSaving(true);
    try {
      const variables = form.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      if (editingId) {
        await updateTemplate(editingId, {
          name: form.name,
          channel: form.channel,
          subject: form.subject || undefined,
          body: form.body,
          variables,
        });
        toast.success("Template updated");
      } else {
        await createTemplate({
          name: form.name,
          channel: form.channel,
          subject: form.subject || undefined,
          body: form.body,
          variables,
        });
        toast.success("Template created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadTemplates();
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteTemplate(id);
      toast.success("Template deleted");
      await loadTemplates();
    } catch {
      toast.error("Failed to delete template");
    }
  }

  function openEdit(t: Template) {
    setForm({
      name: t.name,
      channel: t.channel,
      subject: t.subject ?? "",
      body: t.body,
      variables: t.variables.join(", "),
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  const channelConfig = Object.fromEntries(CHANNELS.map((c) => [c.value, c]));

  return (
    <div className="space-y-6">
      <Link href="/marketing" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketing
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Message Templates</h1>
            <p className="text-sm text-gray-500">{templates.length} templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Channels</option>
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {editingId ? "Edit Template" : "New Template"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Welcome Email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
                <div className="flex gap-2">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm({ ...form, channel: c.value })}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.channel === c.value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span>{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.channel === "EMAIL" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Email subject..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6}
                placeholder="Template body. Use {{variableName}} for dynamic content."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Variables (comma-separated)</label>
              <input
                type="text"
                value={form.variables}
                onChange={(e) => setForm({ ...form, variables: e.target.value })}
                placeholder="firstName, lastName, bookingRef"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No templates yet. Create your first template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const ch = channelConfig[t.channel];
            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ch?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {ch?.icon} {ch?.label ?? t.channel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{t.name}</h3>
                {t.subject && (
                  <p className="text-xs text-gray-500 mb-1">📌 {t.subject}</p>
                )}
                <p className="text-xs text-gray-400 line-clamp-3 flex-1 leading-relaxed">{t.body}</p>
                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {t.variables.map((v) => (
                      <span key={v} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-300 mt-3">
                  {format(new Date(t.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
