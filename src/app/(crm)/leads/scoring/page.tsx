"use client";

import { useState, useEffect } from "react";
import { getScoringRules, createScoringRule, updateScoringRule, deleteScoringRule } from "@/lib/actions/leads";
import { Star, Plus, Trash2, ToggleLeft, ToggleRight, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type ScoringRule = {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  conditions: unknown;
  scorePoints: number;
  isActive: boolean;
  createdAt: Date;
};

const RULE_TYPES = [
  { value: "ACTIVITY_EVENT", label: "Activity Event", hint: "Award points when a specific activity occurs" },
  { value: "PROFILE_COMPLETENESS", label: "Profile Completeness", hint: "Award points when profile fields are filled" },
  { value: "TAG_MATCH", label: "Tag Match", hint: "Award points when a tag is added" },
  { value: "DEAL_VALUE", label: "Deal Value", hint: "Award points based on linked deal value" },
  { value: "ENGAGEMENT", label: "Engagement", hint: "Award points based on engagement count" },
  { value: "RECENCY", label: "Recency", hint: "Award points based on recent activity" },
  { value: "MANUAL", label: "Manual", hint: "Manually applied rule, no auto-conditions" },
];

const RULE_TYPE_COLORS: Record<string, string> = {
  PROFILE_COMPLETENESS: "bg-blue-100 text-blue-700",
  ACTIVITY_EVENT: "bg-green-100 text-green-700",
  ENGAGEMENT: "bg-purple-100 text-purple-700",
  DEAL_VALUE: "bg-yellow-100 text-yellow-700",
  RECENCY: "bg-orange-100 text-orange-700",
  TAG_MATCH: "bg-pink-100 text-pink-700",
  MANUAL: "bg-gray-100 text-gray-700",
};

const ACTIVITY_EVENTS = [
  { value: "email_opened", label: "Email Opened" },
  { value: "email_clicked", label: "Email Clicked" },
  { value: "form_submitted", label: "Form Submitted" },
  { value: "note_added", label: "Note Added" },
  { value: "call_made", label: "Call Made" },
  { value: "meeting_held", label: "Meeting Held" },
  { value: "deal_created", label: "Deal Created" },
  { value: "booking_made", label: "Booking Made" },
];

type ConditionFields = {
  // ACTIVITY_EVENT
  event: string;
  // TAG_MATCH
  tag: string;
  // DEAL_VALUE
  dealOperator: string;
  dealValue: string;
  // ENGAGEMENT
  engagementType: string;
  minCount: string;
  // RECENCY
  withinDays: string;
  recencyField: string;
  // PROFILE_COMPLETENESS / MANUAL: no conditions
};

function defaultConditions(): ConditionFields {
  return {
    event: "email_opened",
    tag: "",
    dealOperator: ">=",
    dealValue: "1000",
    engagementType: "email_opened",
    minCount: "3",
    withinDays: "30",
    recencyField: "lastActivityAt",
  };
}

function buildConditions(ruleType: string, conds: ConditionFields): Record<string, unknown> {
  switch (ruleType) {
    case "ACTIVITY_EVENT":
      return { event: conds.event };
    case "TAG_MATCH":
      return conds.tag ? { tag: conds.tag } : {};
    case "DEAL_VALUE":
      return { operator: conds.dealOperator, value: parseFloat(conds.dealValue) || 0 };
    case "ENGAGEMENT":
      return { type: conds.engagementType, minCount: parseInt(conds.minCount) || 1 };
    case "RECENCY":
      return { withinDays: parseInt(conds.withinDays) || 30, field: conds.recencyField };
    default:
      return {};
  }
}

function formatConditions(ruleType: string, conditions: unknown): string {
  const c = conditions as Record<string, unknown>;
  if (!c || Object.keys(c).length === 0) return "No conditions";
  switch (ruleType) {
    case "ACTIVITY_EVENT":
      return `When: ${ACTIVITY_EVENTS.find(e => e.value === c.event)?.label ?? c.event}`;
    case "TAG_MATCH":
      return `Tag: "${c.tag}"`;
    case "DEAL_VALUE":
      return `Deal value ${c.operator} ${c.value}`;
    case "ENGAGEMENT":
      return `${c.type} at least ${c.minCount} times`;
    case "RECENCY":
      return `${c.field} within ${c.withinDays} days`;
    default:
      return "";
  }
}

function ConditionsForm({
  ruleType,
  conds,
  onChange,
}: {
  ruleType: string;
  conds: ConditionFields;
  onChange: (updates: Partial<ConditionFields>) => void;
}) {
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  switch (ruleType) {
    case "ACTIVITY_EVENT":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Trigger Event *</label>
          <select value={conds.event} onChange={(e) => onChange({ event: e.target.value })} className={cls}>
            {ACTIVITY_EVENTS.map((ev) => (
              <option key={ev.value} value={ev.value}>{ev.label}</option>
            ))}
          </select>
        </div>
      );
    case "TAG_MATCH":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tag Name *</label>
          <input
            type="text"
            value={conds.tag}
            onChange={(e) => onChange({ tag: e.target.value })}
            placeholder="e.g. vip, hot-lead"
            className={cls}
          />
        </div>
      );
    case "DEAL_VALUE":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
            <select value={conds.dealOperator} onChange={(e) => onChange({ dealOperator: e.target.value })} className={cls}>
              <option value=">=">≥ (at least)</option>
              <option value=">">{">"} (more than)</option>
              <option value="<=">≤ (at most)</option>
              <option value="<">{"<"} (less than)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deal Value ($)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={conds.dealValue}
              onChange={(e) => onChange({ dealValue: e.target.value })}
              className={cls}
            />
          </div>
        </div>
      );
    case "ENGAGEMENT":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Engagement Type</label>
            <select value={conds.engagementType} onChange={(e) => onChange({ engagementType: e.target.value })} className={cls}>
              {ACTIVITY_EVENTS.map((ev) => (
                <option key={ev.value} value={ev.value}>{ev.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Count</label>
            <input
              type="number"
              min="1"
              value={conds.minCount}
              onChange={(e) => onChange({ minCount: e.target.value })}
              className={cls}
            />
          </div>
        </div>
      );
    case "RECENCY":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
            <select value={conds.recencyField} onChange={(e) => onChange({ recencyField: e.target.value })} className={cls}>
              <option value="lastActivityAt">Last Activity</option>
              <option value="createdAt">Contact Created</option>
              <option value="updatedAt">Last Updated</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Within (days)</label>
            <input
              type="number"
              min="1"
              value={conds.withinDays}
              onChange={(e) => onChange({ withinDays: e.target.value })}
              className={cls}
            />
          </div>
        </div>
      );
    default:
      return (
        <p className="text-xs text-gray-400 italic">
          No conditions needed for this rule type.
        </p>
      );
  }
}

export default function ScoringRulesPage() {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", ruleType: "ACTIVITY_EVENT", scorePoints: "10" });
  const [conditions, setConditions] = useState<ConditionFields>(defaultConditions());
  const [saving, setSaving] = useState(false);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await getScoringRules();
      setRules(data);
    } catch {
      toast.error("Failed to load scoring rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRules(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }
    if (form.ruleType === "TAG_MATCH" && !conditions.tag) {
      toast.error("Tag name is required");
      return;
    }

    setSaving(true);
    try {
      await createScoringRule({
        name: form.name,
        description: form.description || undefined,
        ruleType: form.ruleType,
        scorePoints: parseInt(form.scorePoints) || 10,
        conditions: buildConditions(form.ruleType, conditions),
      });
      toast.success("Scoring rule created");
      setShowForm(false);
      setForm({ name: "", description: "", ruleType: "ACTIVITY_EVENT", scorePoints: "10" });
      setConditions(defaultConditions());
      await loadRules();
    } catch {
      toast.error("Failed to create rule");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: ScoringRule) {
    try {
      await updateScoringRule(rule.id, { isActive: !rule.isActive });
      toast.success(`Rule ${rule.isActive ? "deactivated" : "activated"}`);
      await loadRules();
    } catch {
      toast.error("Failed to update rule");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this scoring rule?")) return;
    try {
      await deleteScoringRule(id);
      toast.success("Rule deleted");
      await loadRules();
    } catch {
      toast.error("Failed to delete rule");
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/leads" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lead Scoring Rules</h1>
            <p className="text-sm text-gray-500">Configure how leads are scored automatically</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">New Scoring Rule</h3>
            <button type="button" onClick={() => { setShowForm(false); setForm({ name: "", description: "", ruleType: "ACTIVITY_EVENT", scorePoints: "10" }); setConditions(defaultConditions()); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rule Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Email Opened +5"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Score Points
                <span className="font-normal text-gray-400 ml-1">(negative = deduction)</span>
              </label>
              <input
                type="number"
                value={form.scorePoints}
                onChange={(e) => setForm({ ...form, scorePoints: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Rule Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RULE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, ruleType: t.value });
                    setConditions(defaultConditions());
                  }}
                  className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    form.ruleType === t.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`font-semibold ${form.ruleType === t.value ? "text-indigo-700" : "text-gray-800"}`}>{t.label}</p>
                  <p className="text-gray-400 mt-0.5 leading-tight">{t.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this rule"
              className={inputCls}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conditions</p>
            <ConditionsForm
              ruleType={form.ruleType}
              conds={conditions}
              onChange={(updates) => setConditions({ ...conditions, ...updates })}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Rule"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ name: "", description: "", ruleType: "ACTIVITY_EVENT", scorePoints: "10" }); setConditions(defaultConditions()); }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : rules.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No scoring rules yet. Create one to start auto-scoring your leads.</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="flex items-start justify-between px-6 py-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${rule.scorePoints > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {rule.scorePoints > 0 ? "+" : ""}{rule.scorePoints}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${RULE_TYPE_COLORS[rule.ruleType] ?? "bg-gray-100 text-gray-600"}`}>
                      {RULE_TYPES.find((t) => t.value === rule.ruleType)?.label ?? rule.ruleType}
                    </span>
                    {!rule.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                  )}
                  {formatConditions(rule.ruleType, rule.conditions) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatConditions(rule.ruleType, rule.conditions)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(rule)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  title={rule.isActive ? "Deactivate" : "Activate"}
                >
                  {rule.isActive ? (
                    <ToggleRight className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
