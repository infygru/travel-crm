"use client";

import { useState, useEffect } from "react";
import {
  getAutomationRules,
  createAutomationRule,
  toggleAutomationRule,
} from "@/lib/actions/marketing";
import { Zap, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

type AutomationAction = {
  id: string;
  order: number;
  type: string;
  config: Record<string, unknown>;
};

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  triggerData: unknown;
  conditions: unknown;
  createdAt: Date;
  actions: AutomationAction[];
};

const TRIGGERS = [
  { value: "CONTACT_CREATED", label: "Contact Created" },
  { value: "LEAD_STATUS_CHANGED", label: "Lead Status Changed" },
  { value: "DEAL_CREATED", label: "Deal Created" },
  { value: "DEAL_STAGE_CHANGED", label: "Deal Stage Changed" },
  { value: "DEAL_WON", label: "Deal Won" },
  { value: "DEAL_LOST", label: "Deal Lost" },
  { value: "BOOKING_CREATED", label: "Booking Created" },
  { value: "BOOKING_CONFIRMED", label: "Booking Confirmed" },
  { value: "TAG_ADDED", label: "Tag Added" },
  { value: "FORM_SUBMITTED", label: "Form Submitted" },
];

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send Email" },
  { value: "SEND_SMS", label: "Send SMS" },
  { value: "SEND_WHATSAPP", label: "Send WhatsApp" },
  { value: "ASSIGN_TASK", label: "Assign Task" },
  { value: "CHANGE_LEAD_STATUS", label: "Change Lead Status" },
  { value: "CHANGE_DEAL_STAGE", label: "Change Deal Stage" },
  { value: "ENROLL_SEQUENCE", label: "Enroll in Sequence" },
  { value: "ASSIGN_OWNER", label: "Assign Owner" },
  { value: "ADD_TAG", label: "Add Tag" },
  { value: "SEND_NOTIFICATION", label: "Send Notification" },
];

const LEAD_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
];

const TASK_TYPES = [
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING", label: "Meeting" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "DOCUMENT", label: "Document" },
  { value: "QUOTE", label: "Quote" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const TRIGGER_COLORS: Record<string, string> = {
  CONTACT_CREATED: "bg-blue-100 text-blue-700",
  LEAD_STATUS_CHANGED: "bg-purple-100 text-purple-700",
  DEAL_CREATED: "bg-green-100 text-green-700",
  DEAL_STAGE_CHANGED: "bg-yellow-100 text-yellow-700",
  DEAL_WON: "bg-emerald-100 text-emerald-700",
  DEAL_LOST: "bg-red-100 text-red-700",
  BOOKING_CREATED: "bg-indigo-100 text-indigo-700",
  BOOKING_CONFIRMED: "bg-teal-100 text-teal-700",
  TAG_ADDED: "bg-pink-100 text-pink-700",
  FORM_SUBMITTED: "bg-orange-100 text-orange-700",
};

// Per-action config fields
type ActionFields = {
  type: string;
  delayDays: string;
  // SEND_EMAIL / SEND_SMS / SEND_WHATSAPP
  templateId: string;
  subject: string;
  body: string;
  // ASSIGN_TASK
  taskTitle: string;
  taskType: string;
  priority: string;
  dueDays: string;
  // CHANGE_LEAD_STATUS
  leadStatus: string;
  // CHANGE_DEAL_STAGE / ENROLL_SEQUENCE / ASSIGN_OWNER / ADD_TAG
  stageName: string;
  sequenceId: string;
  ownerId: string;
  tag: string;
  // SEND_NOTIFICATION
  message: string;
};

function defaultActionFields(type: string): ActionFields {
  return {
    type,
    delayDays: "0",
    templateId: "",
    subject: "",
    body: "",
    taskTitle: "",
    taskType: "FOLLOW_UP",
    priority: "MEDIUM",
    dueDays: "1",
    leadStatus: "CONTACTED",
    stageName: "",
    sequenceId: "",
    ownerId: "",
    tag: "",
    message: "",
  };
}

function buildActionConfig(fields: ActionFields): Record<string, unknown> {
  const delay = parseInt(fields.delayDays) || 0;
  switch (fields.type) {
    case "SEND_EMAIL":
    case "SEND_SMS":
    case "SEND_WHATSAPP":
      return {
        ...(delay > 0 ? { delayDays: delay } : {}),
        ...(fields.templateId ? { templateId: fields.templateId } : {}),
        ...(fields.subject ? { subject: fields.subject } : {}),
        ...(fields.body ? { body: fields.body } : {}),
      };
    case "ASSIGN_TASK":
      return {
        title: fields.taskTitle,
        type: fields.taskType,
        priority: fields.priority,
        ...(parseInt(fields.dueDays) > 0 ? { dueDays: parseInt(fields.dueDays) } : {}),
      };
    case "CHANGE_LEAD_STATUS":
      return { status: fields.leadStatus };
    case "CHANGE_DEAL_STAGE":
      return { stageName: fields.stageName };
    case "ENROLL_SEQUENCE":
      return { sequenceId: fields.sequenceId };
    case "ASSIGN_OWNER":
      return { ownerId: fields.ownerId };
    case "ADD_TAG":
      return { tag: fields.tag };
    case "SEND_NOTIFICATION":
      return { message: fields.message };
    default:
      return {};
  }
}

// Conditions per trigger
type ConditionFields = {
  fromStatus: string;
  toStatus: string;
  stageName: string;
  tag: string;
  formId: string;
};

function defaultConditions(): ConditionFields {
  return { fromStatus: "", toStatus: "", stageName: "", tag: "", formId: "" };
}

function buildConditions(trigger: string, conds: ConditionFields): Record<string, unknown> {
  switch (trigger) {
    case "LEAD_STATUS_CHANGED":
      return {
        ...(conds.fromStatus ? { fromStatus: conds.fromStatus } : {}),
        ...(conds.toStatus ? { toStatus: conds.toStatus } : {}),
      };
    case "DEAL_STAGE_CHANGED":
      return conds.stageName ? { stageName: conds.stageName } : {};
    case "TAG_ADDED":
      return conds.tag ? { tag: conds.tag } : {};
    case "FORM_SUBMITTED":
      return conds.formId ? { formId: conds.formId } : {};
    default:
      return {};
  }
}

function formatConfigSummary(type: string, config: Record<string, unknown>): string {
  switch (type) {
    case "SEND_EMAIL":
    case "SEND_SMS":
    case "SEND_WHATSAPP": {
      const parts: string[] = [];
      if (config.templateId) parts.push(`Template: ${config.templateId}`);
      if (config.subject) parts.push(`Subject: "${config.subject}"`);
      if (config.delayDays) parts.push(`Delay: ${config.delayDays}d`);
      return parts.join(" · ") || "No template configured";
    }
    case "ASSIGN_TASK":
      return `"${config.title ?? "Untitled"}" · ${config.type ?? ""} · ${config.priority ?? "MEDIUM"}${config.dueDays ? ` · Due in ${config.dueDays}d` : ""}`;
    case "CHANGE_LEAD_STATUS":
      return `→ ${config.status ?? ""}`;
    case "CHANGE_DEAL_STAGE":
      return `→ ${config.stageName ?? ""}`;
    case "ENROLL_SEQUENCE":
      return `Sequence: ${config.sequenceId ?? ""}`;
    case "ASSIGN_OWNER":
      return `Owner: ${config.ownerId ?? ""}`;
    case "ADD_TAG":
      return `Tag: "${config.tag ?? ""}"`;
    case "SEND_NOTIFICATION":
      return `"${String(config.message ?? "").slice(0, 60)}"`;
    default:
      return JSON.stringify(config);
  }
}

// Action config form fields by type
function ActionConfigFields({
  fields,
  onChange,
}: {
  fields: ActionFields;
  onChange: (updated: Partial<ActionFields>) => void;
}) {
  const cls = "w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  switch (fields.type) {
    case "SEND_EMAIL":
    case "SEND_SMS":
    case "SEND_WHATSAPP":
      return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Template ID (optional)</label>
            <input type="text" value={fields.templateId} onChange={(e) => onChange({ templateId: e.target.value })} placeholder="template_id" className={cls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Delay (days)</label>
            <input type="number" min="0" value={fields.delayDays} onChange={(e) => onChange({ delayDays: e.target.value })} className={cls} />
          </div>
          {fields.type === "SEND_EMAIL" && (
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-0.5">Subject override (optional)</label>
              <input type="text" value={fields.subject} onChange={(e) => onChange({ subject: e.target.value })} placeholder="Email subject..." className={cls} />
            </div>
          )}
          {!fields.templateId && (
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-0.5">Body (if no template)</label>
              <textarea value={fields.body} onChange={(e) => onChange({ body: e.target.value })} rows={2} placeholder="Message body..." className={cls + " resize-none"} />
            </div>
          )}
        </div>
      );
    case "ASSIGN_TASK":
      return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-0.5">Task Title *</label>
            <input type="text" value={fields.taskTitle} onChange={(e) => onChange({ taskTitle: e.target.value })} placeholder="e.g. Follow up with lead" className={cls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Task Type</label>
            <select value={fields.taskType} onChange={(e) => onChange({ taskType: e.target.value })} className={cls}>
              {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Priority</label>
            <select value={fields.priority} onChange={(e) => onChange({ priority: e.target.value })} className={cls}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Due in (days)</label>
            <input type="number" min="0" value={fields.dueDays} onChange={(e) => onChange({ dueDays: e.target.value })} className={cls} />
          </div>
        </div>
      );
    case "CHANGE_LEAD_STATUS":
      return (
        <div className="mt-2">
          <label className="block text-xs text-gray-500 mb-0.5">New Status *</label>
          <select value={fields.leadStatus} onChange={(e) => onChange({ leadStatus: e.target.value })} className={cls}>
            {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      );
    case "CHANGE_DEAL_STAGE":
      return (
        <div className="mt-2">
          <label className="block text-xs text-gray-500 mb-0.5">Stage Name *</label>
          <input type="text" value={fields.stageName} onChange={(e) => onChange({ stageName: e.target.value })} placeholder="e.g. Proposal" className={cls} />
        </div>
      );
    case "ENROLL_SEQUENCE":
      return (
        <div className="mt-2">
          <label className="block text-xs text-gray-500 mb-0.5">Sequence ID *</label>
          <input type="text" value={fields.sequenceId} onChange={(e) => onChange({ sequenceId: e.target.value })} placeholder="Sequence ID from Sequences page" className={cls} />
        </div>
      );
    case "ASSIGN_OWNER":
      return (
        <div className="mt-2">
          <label className="block text-xs text-gray-500 mb-0.5">Owner / Agent ID *</label>
          <input type="text" value={fields.ownerId} onChange={(e) => onChange({ ownerId: e.target.value })} placeholder="User ID" className={cls} />
        </div>
      );
    case "ADD_TAG":
      return (
        <div className="mt-2">
          <label className="block text-xs text-gray-500 mb-0.5">Tag Name *</label>
          <input type="text" value={fields.tag} onChange={(e) => onChange({ tag: e.target.value })} placeholder="e.g. hot-lead" className={cls} />
        </div>
      );
    case "SEND_NOTIFICATION":
      return (
        <div className="mt-2">
          <label className="block text-xs text-gray-500 mb-0.5">Notification Message *</label>
          <textarea value={fields.message} onChange={(e) => onChange({ message: e.target.value })} rows={2} placeholder="Message to send as notification..." className={cls + " resize-none"} />
        </div>
      );
    default:
      return null;
  }
}

// Condition fields per trigger
function ConditionsForm({
  triggerType,
  conds,
  onChange,
}: {
  triggerType: string;
  conds: ConditionFields;
  onChange: (updated: Partial<ConditionFields>) => void;
}) {
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  if (triggerType === "LEAD_STATUS_CHANGED") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From Status (optional)</label>
          <select value={conds.fromStatus} onChange={(e) => onChange({ fromStatus: e.target.value })} className={cls}>
            <option value="">Any Status</option>
            {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To Status (optional)</label>
          <select value={conds.toStatus} onChange={(e) => onChange({ toStatus: e.target.value })} className={cls}>
            <option value="">Any Status</option>
            {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
    );
  }
  if (triggerType === "DEAL_STAGE_CHANGED") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Stage Name (optional filter)</label>
        <input type="text" value={conds.stageName} onChange={(e) => onChange({ stageName: e.target.value })} placeholder="e.g. Proposal Sent" className={cls} />
      </div>
    );
  }
  if (triggerType === "TAG_ADDED") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tag (optional filter)</label>
        <input type="text" value={conds.tag} onChange={(e) => onChange({ tag: e.target.value })} placeholder="e.g. vip" className={cls} />
      </div>
    );
  }
  if (triggerType === "FORM_SUBMITTED") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Form ID (optional filter)</label>
        <input type="text" value={conds.formId} onChange={(e) => onChange({ formId: e.target.value })} placeholder="Specific form ID, or leave blank for any" className={cls} />
      </div>
    );
  }
  return <p className="text-xs text-gray-400 italic">No conditions needed for this trigger — it fires for every occurrence.</p>;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", description: "", triggerType: "CONTACT_CREATED" });
  const [conditions, setConditions] = useState<ConditionFields>(defaultConditions());
  const [actionFields, setActionFields] = useState<ActionFields[]>([defaultActionFields("SEND_EMAIL")]);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await getAutomationRules();
      setRules(data as AutomationRule[]);
    } catch {
      toast.error("Failed to load automation rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRules(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleForm.name) { toast.error("Name is required"); return; }

    for (let i = 0; i < actionFields.length; i++) {
      const f = actionFields[i];
      if (f.type === "ASSIGN_TASK" && !f.taskTitle) {
        toast.error(`Action ${i + 1}: Task title is required`);
        return;
      }
      if (f.type === "CHANGE_DEAL_STAGE" && !f.stageName) {
        toast.error(`Action ${i + 1}: Stage name is required`);
        return;
      }
      if (f.type === "ADD_TAG" && !f.tag) {
        toast.error(`Action ${i + 1}: Tag name is required`);
        return;
      }
      if (f.type === "SEND_NOTIFICATION" && !f.message) {
        toast.error(`Action ${i + 1}: Notification message is required`);
        return;
      }
    }

    setSaving(true);
    try {
      await createAutomationRule({
        name: ruleForm.name,
        description: ruleForm.description || undefined,
        triggerType: ruleForm.triggerType,
        conditions: buildConditions(ruleForm.triggerType, conditions),
        actions: actionFields.map((f, i) => ({
          order: i,
          type: f.type,
          config: buildActionConfig(f),
        })),
      });
      toast.success("Automation rule created");
      setShowForm(false);
      setRuleForm({ name: "", description: "", triggerType: "CONTACT_CREATED" });
      setConditions(defaultConditions());
      setActionFields([defaultActionFields("SEND_EMAIL")]);
      await loadRules();
    } catch {
      toast.error("Failed to create automation rule");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: AutomationRule) {
    try {
      await toggleAutomationRule(rule.id, !rule.isActive);
      toast.success(`Rule ${rule.isActive ? "deactivated" : "activated"}`);
      await loadRules();
    } catch {
      toast.error("Failed to toggle rule");
    }
  }

  function addAction() {
    setActionFields([...actionFields, defaultActionFields("SEND_EMAIL")]);
  }

  function removeAction(index: number) {
    setActionFields(actionFields.filter((_, i) => i !== index));
  }

  function updateActionField(index: number, updates: Partial<ActionFields>) {
    setActionFields(actionFields.map((f, i) => {
      if (i !== index) return f;
      // If type changed, reset to fresh defaults for new type
      if (updates.type && updates.type !== f.type) {
        return defaultActionFields(updates.type);
      }
      return { ...f, ...updates };
    }));
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
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Automation Rules</h1>
            <p className="text-sm text-gray-500">
              {rules.filter((r) => r.isActive).length} active · {rules.length} total
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">New Automation Rule</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step 1: Basics */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 1 · Basic Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g. Welcome New Lead"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trigger Event *</label>
                <select
                  value={ruleForm.triggerType}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, triggerType: e.target.value });
                    setConditions(defaultConditions());
                  }}
                  className={inputCls}
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input
                type="text"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                placeholder="What does this automation do?"
                className={inputCls}
              />
            </div>
          </div>

          {/* Step 2: Conditions */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 2 · Conditions (optional filters)</p>
            <ConditionsForm
              triggerType={ruleForm.triggerType}
              conds={conditions}
              onChange={(updates) => setConditions({ ...conditions, ...updates })}
            />
          </div>

          {/* Step 3: Actions */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 3 · Actions</p>
              <button
                type="button"
                onClick={addAction}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Action
              </button>
            </div>
            <div className="space-y-4">
              {actionFields.map((fields, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                      {i + 1}
                    </div>
                    <select
                      value={fields.type}
                      onChange={(e) => updateActionField(i, { type: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {ACTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {actionFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAction(i)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <ActionConfigFields
                    fields={fields}
                    onChange={(updates) => updateActionField(i, updates)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Rule"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setRuleForm({ name: "", description: "", triggerType: "CONTACT_CREATED" });
                setConditions(defaultConditions());
                setActionFields([defaultActionFields("SEND_EMAIL")]);
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">Loading...</div>
        ) : rules.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No automation rules yet. Create your first rule.</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.isActive ? "bg-amber-100" : "bg-gray-100"}`}>
                    <Zap className={`w-4 h-4 ${rule.isActive ? "text-amber-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TRIGGER_COLORS[rule.triggerType] ?? "bg-gray-100 text-gray-600"}`}>
                        {TRIGGERS.find((t) => t.value === rule.triggerType)?.label ?? rule.triggerType}
                      </span>
                      {!rule.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {rule.actions.length} action{rule.actions.length !== 1 ? "s" : ""} ·
                      Created {format(new Date(rule.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  {expandedId === rule.id
                    ? <ChevronDown className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
                  }
                </div>
                <button
                  onClick={() => handleToggle(rule)}
                  className="ml-3 p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
                  title={rule.isActive ? "Deactivate" : "Activate"}
                >
                  {rule.isActive
                    ? <ToggleRight className="w-5 h-5 text-indigo-600" />
                    : <ToggleLeft className="w-5 h-5" />
                  }
                </button>
              </div>

              {expandedId === rule.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {rule.description && (
                    <p className="text-xs text-gray-500 mb-3">{rule.description}</p>
                  )}
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Actions</h4>
                  <div className="space-y-2">
                    {rule.actions.map((action, i) => (
                      <div key={action.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {ACTION_TYPES.find((t) => t.value === action.type)?.label ?? action.type}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatConfigSummary(action.type, action.config)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
