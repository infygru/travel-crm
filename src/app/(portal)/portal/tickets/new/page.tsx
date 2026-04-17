"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createPortalTicket } from "@/lib/actions/portal"
import { ArrowLeft, LifeBuoy, Send } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { value: "BOOKING_ISSUE", label: "Booking Issue" },
  { value: "REFUND_REQUEST", label: "Refund Request" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "GENERAL_INQUIRY", label: "General Inquiry" },
  { value: "DOCUMENT_REQUEST", label: "Document Request" },
  { value: "OTHER", label: "Other" },
]

function NewTicketForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledBookingId = searchParams.get("bookingId") ?? ""

  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("GENERAL_INQUIRY")
  const [bookingId, setBookingId] = useState(prefilledBookingId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await createPortalTicket({
        subject,
        description,
        category,
        bookingId: bookingId || undefined,
      })
      router.push("/portal/tickets")
    } catch {
      setError("Failed to create ticket. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link href="/portal/tickets" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <LifeBuoy className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raise a Support Ticket</h1>
          <p className="text-gray-500 text-sm">Our team will respond within 24 hours</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Brief description of your issue"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            placeholder="Please describe your issue in detail. Include any relevant booking references, dates, or other information that might help us assist you."
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none"
          />
        </div>

        {/* Booking Reference (optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Booking ID <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Link this ticket to a specific booking"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/portal/tickets"
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !subject || !description}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-gray-50 rounded-2xl" />}>
      <NewTicketForm />
    </Suspense>
  )
}
