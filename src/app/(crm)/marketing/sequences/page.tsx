"use client";

import { useState, useEffect } from "react";
import {
  getSequences,
  getSequenceSteps,
  createSequence,
  addSequenceStep,
  removeSequenceStep,
  updateSequence,
  deleteSequence,
} from "@/lib/actions/marketing";
import {
  GitBranch, Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Loader2, Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

type SequenceStep = {
  id: string;
  order: number;
  delayDays: number;
  delayHours: number;
  channel: string;
  subject: string | null;
  body: string | null;
};

type Sequence = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  createdAt: Date;
  _count: { steps: number; enrollments: number };
};

const TRIGGERS = [
  { value: "MANUAL", label: "Manual" },
  { value: "LEAD_CREATED", label: "Lead Created" },
  { value: "LEAD_STATUS_CHANGED", label: "Lead Status Changed" },
  { value: "DEAL_CREATED", label: "Deal Created" },
  { value: "DEAL_STAGE_CHANGED", label: "Deal Stage Changed" },
  { value: "BOOKING_CONFIRMED", label: "Booking Confirmed" },
  { value: "TAG_ADDED", label: "Tag Added" },
];

const CHANNELS = ["EMAIL", "SMS", "WHATSAPP"];
const CHANNEL_ICONS: Record<string, string> = { EMAIL: "📧", SMS: "💬", WHATSAPP: "📱" };

const TRIGGER_COLORS: Record<string, string> = {
  MANUAL: "bg-gray-100 text-gray-700",
  LEAD_CREATED: "bg-blue-100 text-blue-700",
  LEAD_STATUS_CHANGED: "bg-purple-100 text-purple-700",
  DEAL_CREATED: "bg-green-100 text-green-700",
  DEAL_STAGE_CHANGED: "bg-yellow-100 text-yellow-700",
  BOOKING_CONFIRMED: "bg-indigo-100 text-indigo-700",
  TAG_ADDED: "bg-pink-100 text-pink-700",
};

const EMPTY_SEQ_FORM = { name: "", description: "", triggerType: "MANUAL" };
const EMPTY_STEP_FORM = { channel: "EMAIL", subject: "", body: "", delayDays: 0, delayHours: 0 };

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_SEQ_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, SequenceStep[]>>({});
  const [stepsLoading, setStepsLoading] = useState<Record<string, boolean>>({});
  const [addingStepFor, setAddingStepFor] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState(EMPTY_STEP_FORM);

  async function loadSequences() {
    setLoading(true);
    try {
      const data = await getSequences();
      setSequences(data as Sequence[]);
    } catch {
      toast.error("Failed to load sequences");
    } finally {
      setLoading(false);
    }
  }

  async function loadSteps(sequenceId: string) {
    if (steps[sequenceId]) return; // already loaded
    setStepsLoading((prev) => ({ ...prev, [sequenceId]: true }));
    try {
      const data = await getSequenceSteps(sequenceId);
      setSteps((prev) => ({ ...prev, [sequenceId]: data as SequenceStep[] }));
    } catch {
      toast.error("Failed to load steps");
    } finally {
      setStepsLoading((prev) => ({ ...prev, [sequenceId]: false }));
    }
  }

  useEffect(() => { loadSequences(); }, []);

  async function handleExpand(seqId: string) {
    const newExpanded = expandedId === seqId ? null : seqId;
    setExpandedId(newExpanded);
    if (newExpanded) {
      await loadSteps(newExpanded);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await createSequence({
        name: form.name,
        description: form.description || undefined,
        triggerType: form.triggerType,
      });
      toast.success("Sequence created");
      setShowForm(false);
      setForm(EMPTY_SEQ_FORM);
      await loadSequences();
    } catch {
      toast.error("Failed to create sequence");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStep(sequenceId: string) {
    if (!stepForm.body) { toast.error("Body is required"); return; }
    try {
      const existingSteps = steps[sequenceId] ?? [];
      const newStep = await addSequenceStep(sequenceId, {
        order: existingSteps.length,
        delayDays: Number(stepForm.delayDays),
        delayHours: Number(stepForm.delayHours),
        channel: stepForm.channel,
        subject: stepForm.channel === "EMAIL" ? stepForm.subject || undefined : undefined,
        body: stepForm.body,
      });
      toast.success("Step added");
      setAddingStepFor(null);
      setStepForm(EMPTY_STEP_FORM);
      // Force reload steps for this sequence
      setSteps((prev) => {
        const updated = { ...prev };
        delete updated[sequenceId];
        return updated;
      });
      await loadSteps(sequenceId);
      // Update count in sequences list
      setSequences((prev) =>
        prev.map((s) =>
          s.id === sequenceId
            ? { ...s, _count: { ...s._count, steps: s._count.steps + 1 } }
            : s
        )
      );
    } catch {
      toast.error("Failed to add step");
    }
  }

  async function handleRemoveStep(stepId: string, sequenceId: string) {
    if (!confirm("Remove this step?")) return;
    try {
      await removeSequenceStep(stepId);
      toast.success("Step removed");
      setSteps((prev) => ({
        ...prev,
        [sequenceId]: (prev[sequenceId] ?? []).filter((s) => s.id !== stepId),
      }));
      setSequences((prev) =>
        prev.map((s) =>
          s.id === sequenceId
            ? { ...s, _count: { ...s._count, steps: Math.max(0, s._count.steps - 1) } }
            : s
        )
      );
    } catch {
      toast.error("Failed to remove step");
    }
  }

  async function handleToggle(seq: Sequence) {
    try {
      await updateSequence(seq.id, { isActive: !seq.isActive });
      toast.success(`Sequence ${seq.isActive ? "deactivated" : "activated"}`);
      setSequences((prev) =>
        prev.map((s) => (s.id === seq.id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch {
      toast.error("Failed to toggle sequence");
    }
  }

  async function handleDelete(seq: Sequence) {
    if (!confirm(`Delete sequence "${seq.name}"? All steps and enrollments will be removed.`)) return;
    try {
      await deleteSequence(seq.id);
      toast.success("Sequence deleted");
      setSequences((prev) => prev.filter((s) => s.id !== seq.id));
      if (expandedId === seq.id) setExpandedId(null);
    } catch {
      toast.error("Failed to delete sequence");
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  return (
    <div className="space-y-6">
      <Link href="/marketing" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketing
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Sequences</h1>
            <p className="text-sm text-gray-500">
              {sequences.length} sequences · {sequences.filter((s) => s.isActive).length} active
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Sequence
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">New Sequence</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. New Lead Welcome Sequence"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trigger</label>
              <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })} className={inputCls}>
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              className={inputCls}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Creating..." : "Create Sequence"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_SEQ_FORM); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sequences list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">Loading...</div>
        ) : sequences.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <GitBranch className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No sequences yet. Create your first automated sequence.</p>
          </div>
        ) : (
          sequences.map((seq) => (
            <div key={seq.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleExpand(seq.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${seq.isActive ? "bg-blue-100" : "bg-gray-100"}`}>
                    <GitBranch className={`w-4 h-4 ${seq.isActive ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{seq.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TRIGGER_COLORS[seq.triggerType] ?? "bg-gray-100 text-gray-600"}`}>
                        {TRIGGERS.find((t) => t.value === seq.triggerType)?.label ?? seq.triggerType}
                      </span>
                      {!seq.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {seq._count.steps} step{seq._count.steps !== 1 ? "s" : ""} · {seq._count.enrollments} enrolled ·{" "}
                      Created {format(new Date(seq.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="ml-auto flex-shrink-0 pl-2">
                    {expandedId === seq.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(seq)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    title={seq.isActive ? "Deactivate" : "Activate"}
                  >
                    {seq.isActive
                      ? <ToggleRight className="w-5 h-5 text-indigo-600" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(seq)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete sequence"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded steps */}
              {expandedId === seq.id && (
                <div className="border-t border-gray-100 px-5 pb-5">
                  {seq.description && (
                    <p className="text-xs text-gray-500 mt-3 mb-3">{seq.description}</p>
                  )}

                  {stepsLoading[seq.id] ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading steps...
                    </div>
                  ) : (
                    <>
                      {/* Steps timeline */}
                      {(steps[seq.id] ?? []).length > 0 && (
                        <div className="mt-4 space-y-2">
                          {(steps[seq.id] ?? []).map((step, i) => (
                            <div key={step.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-700">
                                    {CHANNEL_ICONS[step.channel]} {step.channel}
                                  </span>
                                  {(step.delayDays > 0 || step.delayHours > 0) && (
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                      <Clock className="w-3 h-3" />
                                      {step.delayDays > 0 && `${step.delayDays}d`}
                                      {step.delayHours > 0 && ` ${step.delayHours}h`} delay
                                    </span>
                                  )}
                                  {i === 0 && (
                                    <span className="text-xs text-gray-400">(immediately)</span>
                                  )}
                                </div>
                                {step.subject && (
                                  <p className="text-xs font-medium text-gray-800 mb-0.5">
                                    Subject: {step.subject}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 line-clamp-2">{step.body}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveStep(step.id, seq.id)}
                                className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors flex-shrink-0"
                                title="Remove step"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {(steps[seq.id] ?? []).length === 0 && seq._count.steps === 0 && (
                        <p className="text-xs text-gray-400 mt-4 mb-2">No steps yet. Add your first step below.</p>
                      )}

                      {/* Add step form */}
                      {addingStepFor === seq.id ? (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                          <h4 className="text-xs font-semibold text-gray-700">Add Step</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Channel</label>
                              <select value={stepForm.channel} onChange={(e) => setStepForm({ ...stepForm, channel: e.target.value })} className={inputCls}>
                                {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_ICONS[c]} {c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Delay Days</label>
                              <input type="number" min={0} value={stepForm.delayDays} onChange={(e) => setStepForm({ ...stepForm, delayDays: Number(e.target.value) })} className={inputCls} />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Delay Hours</label>
                              <input type="number" min={0} max={23} value={stepForm.delayHours} onChange={(e) => setStepForm({ ...stepForm, delayHours: Number(e.target.value) })} className={inputCls} />
                            </div>
                          </div>
                          {stepForm.channel === "EMAIL" && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Subject</label>
                              <input type="text" value={stepForm.subject} onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })} placeholder="Email subject..." className={inputCls} />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Body *</label>
                            <textarea
                              value={stepForm.body}
                              onChange={(e) => setStepForm({ ...stepForm, body: e.target.value })}
                              rows={4}
                              placeholder={`Hi {{firstName}}, ...`}
                              className={`${inputCls} resize-none`}
                            />
                            <p className="text-xs text-gray-400 mt-1">Use {`{{firstName}}`}, {`{{lastName}}`}, {`{{email}}`} as variables.</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAddStep(seq.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                              Add Step
                            </button>
                            <button onClick={() => { setAddingStepFor(null); setStepForm(EMPTY_STEP_FORM); }} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingStepFor(seq.id); setStepForm(EMPTY_STEP_FORM); }}
                          className="mt-4 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Step
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
