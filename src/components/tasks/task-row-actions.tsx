"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Agent = { id: string; name: string | null; email: string | null };

type TaskData = {
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  assigneeId: string | null;
};

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

function EditTaskModal({
  taskId,
  task,
  agents,
  onClose,
}: {
  taskId: string;
  task: TaskData;
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
      await updateTask(taskId, {
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || undefined,
        type: fd.get("type") as string,
        priority: fd.get("priority") as string,
        status: fd.get("status") as string,
        dueDate: (fd.get("dueDate") as string) || undefined,
        assigneeId: (fd.get("assigneeId") as string) || undefined,
      });
      toast.success("Task updated");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input name="title" required defaultValue={task.title} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select name="type" defaultValue={task.type} className={inputCls}>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="FOLLOW_UP">Follow Up</option>
                <option value="DOCUMENT">Document</option>
                <option value="QUOTE">Quote</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select name="priority" defaultValue={task.priority} className={inputCls}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select name="status" defaultValue={task.status} className={inputCls}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input
                name="dueDate"
                type="datetime-local"
                defaultValue={
                  task.dueDate
                    ? new Date(task.dueDate).toISOString().slice(0, 16)
                    : ""
                }
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign To
            </label>
            <select
              name="assigneeId"
              defaultValue={task.assigneeId ?? ""}
              className={inputCls}
            >
              <option value="">— Unassigned —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ?? a.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={task.description ?? ""}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Task details..."
            />
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

export function TaskRowActions({
  taskId,
  task,
  agents,
}: {
  taskId: string;
  task: TaskData;
  agents: Agent[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteTask(taskId);
      toast.success("Task deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete task");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Edit task"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Delete task"
      >
        {deleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>

      {showEdit && (
        <EditTaskModal
          taskId={taskId}
          task={task}
          agents={agents}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
