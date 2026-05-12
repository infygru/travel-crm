"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateVisaStage,
  updateVisaApplication,
  updateDocumentStatus,
  sendVisaReminder,
  deleteVisaApplication,
} from "@/lib/actions/visa";
import { VisaDocStatus, VisaStage } from "@prisma/client";

type Agent = { id: string; name: string | null; email: string };
type VisaApp = {
  id: string;
  stage: VisaStage;
  visaType: string;
  destinationCountry: string;
  embassyCenter: string | null;
  travelDate: Date | null;
  appointmentDate: Date | null;
  appointmentTime: string | null;
  trackingNumber: string | null;
  notes: string | null;
  priority: string;
  agentId: string | null;
};

function toInputDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

// ─── Stage Advance ───────────────────────────────────────────────────────────

const NEXT_STAGE: Record<string, VisaStage> = {
  INITIATED: "DOCUMENTS_PENDING",
  DOCUMENTS_PENDING: "DOCUMENTS_RECEIVED",
  DOCUMENTS_RECEIVED: "SUBMITTED",
  SUBMITTED: "PROCESSING",
  PROCESSING: "APPOINTMENT_BOOKED",
  APPOINTMENT_BOOKED: "APPROVED",
};

// ─── Main Actions ─────────────────────────────────────────────────────────────

function MainActions({ visa, agents }: { visa: VisaApp; agents: Agent[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showEdit, setShowEdit] = useState(false);
  const [showStageModal, setShowStageModal] = useState<string | null>(null);

  // Edit form state
  const [editData, setEditData] = useState({
    embassyCenter: visa.embassyCenter ?? "",
    travelDate: toInputDate(visa.travelDate),
    appointmentDate: toInputDate(visa.appointmentDate),
    appointmentTime: visa.appointmentTime ?? "",
    trackingNumber: visa.trackingNumber ?? "",
    notes: visa.notes ?? "",
    priority: visa.priority,
    agentId: visa.agentId ?? "",
  });

  // Stage advance extra fields
  const [stageExtra, setStageExtra] = useState({
    submittedAt: new Date().toISOString().slice(0, 10),
    appointmentDate: "",
    appointmentTime: "",
    decisionDate: new Date().toISOString().slice(0, 10),
    rejectionReason: "",
    trackingNumber: "",
  });

  const nextStage = NEXT_STAGE[visa.stage];
  const isTerminal = ["APPROVED", "REJECTED", "CANCELLED"].includes(visa.stage);

  function handleAdvance() {
    if (!nextStage) return;
    setShowStageModal(nextStage);
  }

  function handleStageConfirm() {
    if (!showStageModal) return;
    startTransition(async () => {
      try {
        await updateVisaStage(visa.id, showStageModal as VisaStage, {
          submittedAt: showStageModal === "SUBMITTED" ? stageExtra.submittedAt : undefined,
          appointmentDate: showStageModal === "APPOINTMENT_BOOKED" ? stageExtra.appointmentDate : undefined,
          appointmentTime: showStageModal === "APPOINTMENT_BOOKED" ? stageExtra.appointmentTime : undefined,
          decisionDate: ["APPROVED", "REJECTED"].includes(showStageModal) ? stageExtra.decisionDate : undefined,
          rejectionReason: showStageModal === "REJECTED" ? stageExtra.rejectionReason : undefined,
          trackingNumber: stageExtra.trackingNumber || undefined,
        });
        toast.success("Stage updated");
        setShowStageModal(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update stage");
      }
    });
  }

  function handleReject() {
    setShowStageModal("REJECTED");
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        await updateVisaStage(visa.id, "CANCELLED");
        toast.success("Application cancelled");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleSendReminder(type: "document" | "deadline" | "appointment" | "status") {
    startTransition(async () => {
      try {
        await sendVisaReminder(visa.id, type);
        toast.success("Reminder sent");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send");
      }
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      try {
        await updateVisaApplication(visa.id, {
          embassyCenter: editData.embassyCenter || undefined,
          travelDate: editData.travelDate || undefined,
          appointmentDate: editData.appointmentDate || undefined,
          appointmentTime: editData.appointmentTime || undefined,
          trackingNumber: editData.trackingNumber || undefined,
          notes: editData.notes || undefined,
          priority: editData.priority as never,
          agentId: editData.agentId || undefined,
        });
        toast.success("Application updated");
        setShowEdit(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this visa application? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteVisaApplication(visa.id);
        toast.success("Deleted");
        router.push("/visa");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Advance stage */}
        {!isTerminal && nextStage && (
          <button
            onClick={handleAdvance}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Advance to {nextStage.replace(/_/g, " ")}
          </button>
        )}

        {/* Approve / Reject shortcuts */}
        {visa.stage === "PROCESSING" || visa.stage === "APPOINTMENT_BOOKED" ? (
          <button
            onClick={handleReject}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            Mark Rejected
          </button>
        ) : null}

        {/* Reminders dropdown */}
        <div className="relative group">
          <button className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
            Send Reminder ▾
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px] hidden group-hover:block">
            {[
              { type: "document" as const, label: "Document Reminder" },
              { type: "deadline" as const, label: "Deadline Alert" },
              { type: "appointment" as const, label: "Appointment Reminder" },
              { type: "status" as const, label: "Status Update" },
            ].map((r) => (
              <button
                key={r.type}
                onClick={() => handleSendReminder(r.type)}
                disabled={isPending}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowEdit(true)}
          className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Edit
        </button>

        {!isTerminal && (
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 rounded-lg"
          >
            Cancel
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-red-600 rounded-lg"
        >
          Delete
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Edit Visa Application</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Embassy / Processing Center</label>
                <input
                  value={editData.embassyCenter}
                  onChange={(e) => setEditData({ ...editData, embassyCenter: e.target.value })}
                  placeholder="e.g. VFS Global Chennai"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={editData.travelDate}
                    onChange={(e) => setEditData({ ...editData, travelDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={editData.appointmentDate}
                    onChange={(e) => setEditData({ ...editData, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Time</label>
                  <input
                    type="time"
                    value={editData.appointmentTime}
                    onChange={(e) => setEditData({ ...editData, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tracking Number</label>
                <input
                  value={editData.trackingNumber}
                  onChange={(e) => setEditData({ ...editData, trackingNumber: e.target.value })}
                  placeholder="Embassy / VFS tracking ref"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Agent</label>
                <select
                  value={editData.agentId}
                  onChange={(e) => setEditData({ ...editData, agentId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isPending}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage advance modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Move to: {showStageModal.replace(/_/g, " ")}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {showStageModal === "SUBMITTED" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Submission Date</label>
                    <input
                      type="date"
                      value={stageExtra.submittedAt}
                      onChange={(e) => setStageExtra({ ...stageExtra, submittedAt: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tracking Number (optional)</label>
                    <input
                      value={stageExtra.trackingNumber}
                      onChange={(e) => setStageExtra({ ...stageExtra, trackingNumber: e.target.value })}
                      placeholder="VFS / Embassy tracking ref"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
              {showStageModal === "APPOINTMENT_BOOKED" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date</label>
                    <input
                      type="date"
                      value={stageExtra.appointmentDate}
                      onChange={(e) => setStageExtra({ ...stageExtra, appointmentDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                    <input
                      type="time"
                      value={stageExtra.appointmentTime}
                      onChange={(e) => setStageExtra({ ...stageExtra, appointmentTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
              {(showStageModal === "APPROVED" || showStageModal === "REJECTED") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Decision Date</label>
                  <input
                    type="date"
                    value={stageExtra.decisionDate}
                    onChange={(e) => setStageExtra({ ...stageExtra, decisionDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              {showStageModal === "REJECTED" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rejection Reason</label>
                  <textarea
                    value={stageExtra.rejectionReason}
                    onChange={(e) => setStageExtra({ ...stageExtra, rejectionReason: e.target.value })}
                    rows={3}
                    placeholder="Explain reason for rejection..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              )}
              {!["SUBMITTED", "APPOINTMENT_BOOKED", "APPROVED", "REJECTED"].includes(showStageModal) && (
                <p className="text-sm text-gray-600">
                  Confirm moving this application to <strong>{showStageModal.replace(/_/g, " ")}</strong>.
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowStageModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={handleStageConfirm}
                disabled={isPending}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                  showStageModal === "REJECTED" ? "bg-red-600 hover:bg-red-700" :
                  showStageModal === "APPROVED" ? "bg-green-600 hover:bg-green-700" :
                  "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isPending ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Document status update button ───────────────────────────────────────────

function DocStatusUpdate({ docId, currentStatus, visaId }: {
  docId: string;
  currentStatus: VisaDocStatus;
  visaId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  const nextStatuses: VisaDocStatus[] = ["PENDING", "RECEIVED", "VERIFIED", "REJECTED"].filter(
    (s) => s !== currentStatus
  ) as VisaDocStatus[];

  function handleStatusChange(status: VisaDocStatus) {
    setShowMenu(false);
    startTransition(async () => {
      try {
        await updateDocumentStatus(docId, status);
        toast.success("Document updated");
        router.refresh();
      } catch {
        toast.error("Failed to update");
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isPending}
        className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
      >
        {isPending ? "…" : "▾"}
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[130px]">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg capitalize"
              >
                Mark as {s.toLowerCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Exported compound component ─────────────────────────────────────────────

export function VisaDetailActions({ visa, agents }: { visa: VisaApp; agents: Agent[] }) {
  return <MainActions visa={visa} agents={agents} />;
}

VisaDetailActions.DocStatusUpdate = DocStatusUpdate;
