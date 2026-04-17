import { getTasks } from "@/lib/actions/tasks";
import { getAgents } from "@/lib/actions/contacts";
import { TASK_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import { format, isToday, isPast } from "date-fns";
import Link from "next/link";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { TaskStatusToggle } from "@/components/tasks/task-status-toggle";
import { TaskRowActions } from "@/components/tasks/task-row-actions";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";

interface TasksPageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    assigneeId?: string;
    page?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");

  const [{ tasks, total, totalPages }, agents] = await Promise.all([
    getTasks({
      status: params.status,
      type: params.type,
      assigneeId: params.assigneeId,
      page,
      limit: 25,
    }),
    getAgents(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">{total} total tasks</p>
        </div>
        <NewTaskDialog agents={agents} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select
              name="type"
              defaultValue={params.type ?? ""}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Types</option>
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
            <select
              name="assigneeId"
              defaultValue={params.assigneeId ?? ""}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ?? a.email}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Apply
          </button>
          {(params.status || params.type || params.assigneeId) && (
            <Link
              href="/tasks"
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {tasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-2">No tasks found</p>
              <p className="text-xs text-gray-300">Create a task using the button above</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isOverdue =
                task.dueDate &&
                isPast(new Date(task.dueDate)) &&
                task.status !== "DONE" &&
                task.status !== "CANCELLED";
              const isDueToday =
                task.dueDate && isToday(new Date(task.dueDate));

              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${
                    task.status === "DONE" || task.status === "CANCELLED"
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  {/* Status Toggle */}
                  <div className="pt-0.5 flex-shrink-0">
                    <TaskStatusToggle
                      taskId={task.id}
                      currentStatus={task.status}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm font-medium ${
                          task.status === "DONE" || task.status === "CANCELLED"
                            ? "line-through text-gray-400"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {task.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xl">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      {task.contact && (
                        <Link
                          href={`/contacts/${task.contact.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          {task.contact.firstName} {task.contact.lastName}
                        </Link>
                      )}
                      {task.deal && (
                        <Link
                          href={`/deals/${task.deal.id}`}
                          className="text-xs text-violet-600 hover:text-violet-700"
                        >
                          {task.deal.title}
                        </Link>
                      )}
                      {task.dueDate && (
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            isOverdue
                              ? "text-red-500"
                              : isDueToday
                              ? "text-amber-500"
                              : "text-gray-400"
                          }`}
                        >
                          {isOverdue ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {isOverdue
                            ? "Overdue · "
                            : isDueToday
                            ? "Due today · "
                            : ""}
                          {format(new Date(task.dueDate), "MMM d, yyyy · h:mm a")}
                        </div>
                      )}
                      {task.assignee && (
                        <span className="text-xs text-gray-400">
                          {task.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: priority, status, actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_COLORS[task.status]}`}
                    >
                      {task.status.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TaskRowActions
                        taskId={task.id}
                        task={{
                          title: task.title,
                          description: task.description,
                          type: task.type,
                          priority: task.priority,
                          status: task.status,
                          dueDate: task.dueDate,
                          assigneeId: task.assigneeId,
                        }}
                        agents={agents}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}`}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}`}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
