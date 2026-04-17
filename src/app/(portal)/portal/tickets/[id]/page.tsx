"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getPortalTicket, createPortalTicketReply } from "@/lib/actions/portal"
import { format } from "date-fns"
import Link from "next/link"
import { ArrowLeft, LifeBuoy, Send, MessageSquare, User, Clock } from "lucide-react"

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  PENDING_CUSTOMER: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
}

type TicketReply = {
  id: string
  body: string
  isInternal: boolean
  fromEmail: string | null
  createdAt: Date
  author: { name: string | null; image: string | null } | null
}

type Ticket = {
  id: string
  ticketNumber: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: Date
  updatedAt: Date
  replies: TicketReply[]
}

export default function PortalTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getPortalTicket(ticketId).then((t) => {
      setTicket(t as Ticket | null)
      setLoading(false)
    })
  }, [ticketId])

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setSubmitting(true)
    setError("")
    try {
      await createPortalTicketReply(ticketId, reply.trim())
      setReply("")
      // Refresh ticket data
      const updated = await getPortalTicket(ticketId)
      setTicket(updated as Ticket | null)
    } catch {
      setError("Failed to send reply. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Ticket not found.</p>
        <Link href="/portal/tickets" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block">
          Back to Tickets
        </Link>
      </div>
    )
  }

  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED"

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/portal/tickets" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </Link>

      {/* Ticket Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <LifeBuoy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TICKET_STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-700"}`}>
                {ticket.status.replace("_", " ")}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-600"}`}>
                {ticket.priority}
              </span>
              <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {ticket.category.replace(/_/g, " ")} · Opened {format(new Date(ticket.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          Conversation ({ticket.replies.length} {ticket.replies.length === 1 ? "reply" : "replies"})
        </h2>

        {ticket.replies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No replies yet. Our support team will respond shortly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ticket.replies.map((r) => {
              const isAgent = !!r.author
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl p-5 ${isAgent
                    ? "bg-indigo-50 border border-indigo-100"
                    : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isAgent ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                      {isAgent ? (r.author?.name?.[0] ?? "A") : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {isAgent ? (r.author?.name ?? "Support Team") : "You"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(r.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    {isAgent && (
                      <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        Support
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{r.body}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reply Form */}
      {!isClosed ? (
        <form onSubmit={handleSubmitReply} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Add a Reply</h3>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
            rows={4}
            placeholder="Type your message here..."
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting || !reply.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 font-medium">
            This ticket is {ticket.status.toLowerCase()}. If you need further assistance, please{" "}
            <Link href="/portal/tickets/new" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              open a new ticket
            </Link>.
          </p>
        </div>
      )}
    </div>
  )
}
