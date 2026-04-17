import { getTicketById } from "@/lib/actions/tickets";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Calendar,
  Hash,
  Tag,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { TICKET_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import { TicketActions } from "./ticket-actions";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

const TICKET_CATEGORY_LABELS: Record<string, string> = {
  BOOKING_ISSUE: "Booking Issue",
  REFUND_REQUEST: "Refund Request",
  COMPLAINT: "Complaint",
  GENERAL_INQUIRY: "General Inquiry",
  DOCUMENT_REQUEST: "Document Request",
  OTHER: "Other",
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  const ticket = await getTicketById(id);
  if (!ticket) notFound();

  const slaIsNear = ticket.slaDeadline
    ? new Date(ticket.slaDeadline).getTime() - Date.now() < 2 * 60 * 60 * 1000
    : false;
  const slaPast = ticket.slaDeadline ? new Date(ticket.slaDeadline) < new Date() : false;

  return (
    <div className="space-y-4 max-w-6xl">
      <Link href="/tickets" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticket header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-mono text-gray-400 mb-1">{ticket.ticketNumber}</p>
                <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${TICKET_STATUS_COLORS[ticket.status]}`}>
                  {ticket.status.replace(/_/g, " ")}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Created {format(new Date(ticket.createdAt), "MMM d, yyyy · h:mm a")}
              </span>
              {ticket.createdBy && (
                <span className="text-xs text-gray-400">by {ticket.createdBy.name}</span>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
              </span>
            </div>
          </div>

          {/* Thread */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Conversation ({ticket.replies.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-50">
              {ticket.replies.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">
                  No replies yet. Be the first to respond.
                </div>
              ) : (
                ticket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`px-6 py-4 ${reply.isInternal ? "bg-yellow-50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                        {reply.author?.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {reply.author?.name ?? reply.fromEmail ?? "Unknown"}
                          </span>
                          {reply.isInternal && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-medium">
                              Internal Note
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {reply.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply composer */}
            <TicketActions ticketId={ticket.id} currentStatus={ticket.status} />
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Current Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                  {ticket.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Priority</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Channel</span>
                <span className="text-xs text-gray-700">{ticket.channel.replace(/_/g, " ")}</span>
              </div>
            </div>
          </div>

          {/* SLA */}
          {ticket.slaDeadline && (
            <div className={`bg-white rounded-xl border shadow-sm p-4 ${slaPast ? "border-red-200" : slaIsNear ? "border-orange-200" : "border-gray-200"}`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                {(slaPast || slaIsNear) && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                SLA Deadline
              </h3>
              <p className={`text-sm font-medium ${slaPast ? "text-red-600" : slaIsNear ? "text-orange-600" : "text-gray-700"}`}>
                {format(new Date(ticket.slaDeadline), "MMM d, yyyy · h:mm a")}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {slaPast
                  ? `Overdue by ${formatDistanceToNow(new Date(ticket.slaDeadline))}`
                  : `Due ${formatDistanceToNow(new Date(ticket.slaDeadline), { addSuffix: true })}`}
              </p>
            </div>
          )}

          {/* Assignee */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Assignee
            </h3>
            {ticket.assignee ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                  {ticket.assignee.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{ticket.assignee.name}</p>
                  <p className="text-xs text-gray-400">{ticket.assignee.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unassigned</p>
            )}
          </div>

          {/* Contact */}
          {ticket.contact && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Contact
              </h3>
              <Link href={`/contacts/${ticket.contact.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {ticket.contact.firstName} {ticket.contact.lastName}
              </Link>
              {ticket.contact.email && (
                <p className="text-xs text-gray-500 mt-0.5">{ticket.contact.email}</p>
              )}
              {ticket.contact.phone && (
                <p className="text-xs text-gray-500">{ticket.contact.phone}</p>
              )}
            </div>
          )}

          {/* Linked Booking */}
          {ticket.booking && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                Booking
              </h3>
              <Link href={`/bookings/${ticket.booking.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {ticket.booking.bookingRef.slice(0, 8).toUpperCase()}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">{ticket.booking.status}</p>
            </div>
          )}

          {/* Linked Deal */}
          {ticket.deal && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                Deal
              </h3>
              <Link href={`/deals/${ticket.deal.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {ticket.deal.title}
              </Link>
            </div>
          )}

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-1">
                {ticket.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Timeline
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Created</span>
                <span className="text-xs text-gray-700">{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
              </div>
              {ticket.firstResponseAt && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">First Response</span>
                  <span className="text-xs text-gray-700">{format(new Date(ticket.firstResponseAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Resolved</span>
                  <span className="text-xs text-green-600">{format(new Date(ticket.resolvedAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {ticket.closedAt && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Closed</span>
                  <span className="text-xs text-gray-700">{format(new Date(ticket.closedAt), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status history */}
          {ticket.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-gray-400" />
                Status History
              </h3>
              <div className="space-y-2">
                {ticket.statusHistory.map((h) => (
                  <div key={h.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-700">
                        {h.fromStatus ? `${h.fromStatus.replace(/_/g, " ")} → ` : ""}
                        <span className="font-medium">{h.toStatus.replace(/_/g, " ")}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(h.createdAt), "MMM d · h:mm a")}
                        {h.changedBy && ` · ${h.changedBy.name}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
