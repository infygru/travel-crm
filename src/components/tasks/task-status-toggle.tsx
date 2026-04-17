"use client";

import { useState } from "react";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

const STATUS_CYCLE: Record<string, string> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
  CANCELLED: "TODO",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  TODO: <Circle className="w-5 h-5 text-gray-300 hover:text-indigo-400" />,
  IN_PROGRESS: <Clock className="w-5 h-5 text-amber-400" />,
  DONE: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  CANCELLED: <XCircle className="w-5 h-5 text-gray-300" />,
};

const STATUS_TITLE: Record<string, string> = {
  TODO: "Click to start",
  IN_PROGRESS: "Click to mark done",
  DONE: "Click to reopen",
  CANCELLED: "Click to reopen",
};

export function TaskStatusToggle({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;
    const newStatus = STATUS_CYCLE[status] ?? "TODO";
    setIsLoading(true);
    const prev = status;
    setStatus(newStatus);

    try {
      await updateTaskStatus(taskId, newStatus);
      const labels: Record<string, string> = {
        IN_PROGRESS: "Task started",
        DONE: "Task completed!",
        TODO: "Task reopened",
      };
      toast.success(labels[newStatus] ?? "Status updated");
    } catch {
      setStatus(prev);
      toast.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      title={STATUS_TITLE[status]}
      className="transition-all hover:scale-110 disabled:opacity-50"
    >
      {STATUS_ICON[status] ?? <Circle className="w-5 h-5 text-gray-300" />}
    </button>
  );
}
