"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateContact, addContactNote, deleteContact } from "@/lib/actions/contacts";
import { createTask } from "@/lib/actions/tasks";
import { createDeal } from "@/lib/actions/deals";
import { enrollContactInSequence } from "@/lib/actions/marketing";
import { X, Pencil, Trash2, AlertCircle, Plus, MessageSquare, CheckSquare, ChevronRight, Briefcase, Calendar, GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Agent = { id: string; name: string | null; email: string | null };

type ContactData = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  jobTitle: string | null;
  department: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  leadSource: string | null;
  leadStatus: string;
  leadScore: number;
  tags: string[];
  nationality: string | null;
  passportNumber: string | null;
  passportExpiry: Date | null;
  dateOfBirth: Date | null;
  preferredContact: string | null;
  notes: string | null;
  companyId: string | null;
  ownerId: string | null;
};

// ── Edit Contact Modal ──────────────────────────────────────────────────────

function EditContactModal({
  contactId,
  contact,
  agents,
  onClose,
}: {
  contactId: string;
  contact: ContactData;
  agents: Agent[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await updateContact(contactId, {
        firstName: fd.get("firstName") as string,
        lastName: fd.get("lastName") as string,
        email: (fd.get("email") as string) || undefined,
        phone: (fd.get("phone") as string) || undefined,
        mobile: (fd.get("mobile") as string) || undefined,
        jobTitle: (fd.get("jobTitle") as string) || undefined,
        department: (fd.get("department") as string) || undefined,
        country: (fd.get("country") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
        leadSource: (fd.get("leadSource") as string) || undefined,
        leadStatus: fd.get("leadStatus") as string,
        leadScore: Number(fd.get("leadScore")) || 0,
        nationality: (fd.get("nationality") as string) || undefined,
        passportNumber: (fd.get("passportNumber") as string) || undefined,
        passportExpiry: (fd.get("passportExpiry") as string) || undefined,
        dateOfBirth: (fd.get("dateOfBirth") as string) || undefined,
        preferredContact: (fd.get("preferredContact") as string) || undefined,
        ownerId: (fd.get("ownerId") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
        tags: (fd.get("tags") as string)
          ? (fd.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      });
      toast.success("Contact updated");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contact");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Edit Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Basic Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>First Name *</label>
                <input name="firstName" required defaultValue={contact.firstName} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Name *</label>
                <input name="lastName" required defaultValue={contact.lastName} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input name="email" type="email" defaultValue={contact.email ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input name="phone" defaultValue={contact.phone ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mobile</label>
                <input name="mobile" defaultValue={contact.mobile ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Job Title</label>
                <input name="jobTitle" defaultValue={contact.jobTitle ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input name="department" defaultValue={contact.department ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nationality</label>
                <input name="nationality" defaultValue={contact.nationality ?? ""} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input name="city" defaultValue={contact.city ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input name="country" defaultValue={contact.country ?? ""} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address</label>
                <input name="address" defaultValue={contact.address ?? ""} className={inputCls} />
              </div>
            </div>
          </div>

          {/* CRM Fields */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CRM</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Lead Status</label>
                <select name="leadStatus" defaultValue={contact.leadStatus} className={inputCls}>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Lead Source</label>
                <select name="leadSource" defaultValue={contact.leadSource ?? ""} className={inputCls}>
                  <option value="">— None —</option>
                  <option value="WEBSITE">Website</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="COLD_CALL">Cold Call</option>
                  <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                  <option value="TRADE_SHOW">Trade Show</option>
                  <option value="PARTNER">Partner</option>
                  <option value="ADVERTISEMENT">Advertisement</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Lead Score (0–100)</label>
                <input name="leadScore" type="number" min={0} max={100} defaultValue={contact.leadScore} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Assigned To</label>
                <select name="ownerId" defaultValue={contact.ownerId ?? ""} className={inputCls}>
                  <option value="">— Unassigned —</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tags (comma-separated)</label>
                <input name="tags" defaultValue={contact.tags.join(", ")} placeholder="vip, adventure, honeymoon" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Travel Documents */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Travel Documents</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Passport Number</label>
                <input name="passportNumber" defaultValue={contact.passportNumber ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Passport Expiry</label>
                <input
                  name="passportExpiry"
                  type="date"
                  defaultValue={contact.passportExpiry ? new Date(contact.passportExpiry).toISOString().split("T")[0] : ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  defaultValue={contact.dateOfBirth ? new Date(contact.dateOfBirth).toISOString().split("T")[0] : ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Preferred Contact</label>
                <select name="preferredContact" defaultValue={contact.preferredContact ?? "EMAIL"} className={inputCls}>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Internal Notes</label>
            <textarea name="notes" defaultValue={contact.notes ?? ""} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Note Form ───────────────────────────────────────────────────────────

export function AddNoteForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addContactNote(contactId, content.trim());
      setContent("");
      toast.success("Note added");
      router.refresh();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note about this contact..."
        rows={3}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {saving ? "Adding..." : "Add Note"}
        </button>
      </div>
    </form>
  );
}

// ── Quick Task Form ─────────────────────────────────────────────────────────

export function QuickTaskForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", type: "FOLLOW_UP", dueDate: "", priority: "MEDIUM" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createTask({
        title: form.title,
        type: form.type,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        contactId,
      });
      setForm({ title: "", type: "FOLLOW_UP", dueDate: "", priority: "MEDIUM" });
      setShow(false);
      toast.success("Task created");
      router.refresh();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setShow(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
      <h4 className="text-xs font-semibold text-gray-700">New Task</h4>
      <div>
        <input
          autoFocus
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Task title..."
          required
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
          <option value="CALL">Call</option>
          <option value="EMAIL">Email</option>
          <option value="MEETING">Meeting</option>
          <option value="FOLLOW_UP">Follow Up</option>
          <option value="DOCUMENT">Document</option>
          <option value="QUOTE">Quote</option>
          <option value="OTHER">Other</option>
        </select>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputCls}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          {saving ? "Creating..." : "Create Task"}
        </button>
        <button
          type="button"
          onClick={() => { setShow(false); setForm({ title: "", type: "FOLLOW_UP", dueDate: "", priority: "MEDIUM" }); }}
          className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Delete Confirm ──────────────────────────────────────────────────────────

function DeleteConfirmModal({ contactId, contactName, onClose }: { contactId: string; contactName: string; onClose: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteContact(contactId);
      toast.success("Contact archived");
      router.push("/contacts");
    } catch {
      toast.error("Failed to delete contact");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Archive Contact</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Archive <span className="font-semibold text-gray-700">{contactName}</span>? They will no longer appear in your active contacts but their history is preserved.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Archiving..." : "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ContactActions component ───────────────────────────────────────────

export function ContactActions({
  contactId,
  contact,
  agents,
}: {
  contactId: string;
  contact: ContactData;
  agents: Agent[];
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>
      <button
        onClick={() => setShowDelete(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors border border-transparent hover:border-red-200"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Archive
      </button>

      {showEdit && (
        <EditContactModal
          contactId={contactId}
          contact={contact}
          agents={agents}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showDelete && (
        <DeleteConfirmModal
          contactId={contactId}
          contactName={`${contact.firstName} ${contact.lastName}`}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

// ── Lead Status Quick Buttons ────────────────────────────────────────────────

const LEAD_STATUS_FLOW = [
  { value: "NEW", label: "New", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "PROPOSAL_SENT", label: "Proposal", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "CONVERTED", label: "Converted", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "LOST", label: "Lost", color: "bg-red-100 text-red-700 border-red-200" },
];

export function LeadStatusButtons({ contactId, currentStatus }: { contactId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function changeStatus(status: string) {
    if (status === currentStatus) return;
    setLoading(status);
    try {
      await updateContact(contactId, { leadStatus: status });
      toast.success(`Status updated to ${status.replace(/_/g, " ").toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {LEAD_STATUS_FLOW.map((s, i) => {
        const isActive = s.value === currentStatus;
        const currentIdx = LEAD_STATUS_FLOW.findIndex(x => x.value === currentStatus);
        const isPast = i < currentIdx;
        return (
          <div key={s.value} className="flex items-center gap-1">
            <button
              onClick={() => changeStatus(s.value)}
              disabled={!!loading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all disabled:cursor-not-allowed ${
                isActive
                  ? s.color + " ring-1 ring-offset-0 ring-current shadow-sm"
                  : isPast
                  ? "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {loading === s.value ? "..." : s.label}
            </button>
            {i < LEAD_STATUS_FLOW.length - 1 && (
              <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Create Deal Button ───────────────────────────────────────────────────────

export function CreateDealButton({ contactId, contactName }: { contactId: string; contactName: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(`Deal with ${contactName}`);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const deal = await createDeal({ title, contactId });
      toast.success("Deal created");
      router.push(`/deals/${deal.id}`);
    } catch {
      toast.error("Failed to create deal");
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <Briefcase className="w-3.5 h-3.5" /> New Deal
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Create Deal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShow(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Creating..." : "Create Deal"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Booking Button ────────────────────────────────────────────────────

export function CreateBookingButton({ contactId }: { contactId: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/bookings/new?contactId=${contactId}`)}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
    >
      <Calendar className="w-3.5 h-3.5" /> New Booking
    </button>
  );
}

// ── Enroll in Sequence Button ──────────────────────────────────────────────

type Sequence = { id: string; name: string };

export function EnrollSequenceButton({
  contactId,
  sequences,
}: {
  contactId: string;
  sequences: Sequence[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  if (sequences.length === 0) return null;

  async function handleEnroll(sequenceId: string) {
    setEnrolling(sequenceId);
    try {
      await enrollContactInSequence(contactId, sequenceId);
      toast.success("Enrolled in sequence");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
      >
        <GitBranch className="w-3.5 h-3.5" /> Enroll in Sequence
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[220px] overflow-hidden">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Select Sequence
            </p>
            {sequences.map((seq) => (
              <button
                key={seq.id}
                onClick={() => handleEnroll(seq.id)}
                disabled={enrolling === seq.id}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {enrolling === seq.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                ) : (
                  <GitBranch className="w-3.5 h-3.5 text-purple-500" />
                )}
                {seq.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

