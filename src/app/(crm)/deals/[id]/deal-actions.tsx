"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateDeal, deleteDeal, updateDealStage, addDealNote, addDealTask } from "@/lib/actions/deals"
import { Check, X, Pencil, Trash2, AlertCircle, Plus, ListTodo } from "lucide-react"
import { toast } from "sonner"

type Stage = { id: string; name: string; color: string; probability: number }

// Stage selector button
export function StageButton({ dealId, stage, isActive, isPast }: { dealId: string; stage: Stage; isActive: boolean; isPast: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (isActive) return
    setLoading(true)
    await updateDealStage(dealId, stage.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || isActive}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? "text-white shadow-sm"
          : isPast
          ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
      } disabled:cursor-not-allowed`}
      style={isActive ? { backgroundColor: stage.color } : {}}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? "white" : stage.color }} />
      {stage.name}
    </button>
  )
}

// Add note form
export function AddNoteForm({ dealId }: { dealId: string }) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    try {
      await addDealNote(dealId, content)
      setContent("")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note..."
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Add Note"}
        </button>
      </div>
    </form>
  )
}

// Edit deal form
export function EditDealModal({ dealId, deal, onClose }: {
  dealId: string
  deal: { title: string; value: number; currency: string; probability: number; priority: string; description: string; expectedClose: string; stageId: string }
  onClose: () => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    try {
      await updateDeal(dealId, {
        title: fd.get("title") as string,
        value: Number(fd.get("value")),
        currency: fd.get("currency") as string,
        probability: Number(fd.get("probability")),
        priority: fd.get("priority") as string,
        description: fd.get("description") as string || undefined,
        expectedClose: fd.get("expectedClose") as string || undefined,
      })
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deal")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Deal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={deal.title} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Value</label>
              <input name="value" type="number" defaultValue={deal.value} min={0} step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select name="currency" defaultValue={deal.currency} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {["INR","USD","EUR","GBP","AED","SGD"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select name="priority" defaultValue={deal.priority} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {["LOW","MEDIUM","HIGH","URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Probability %</label>
              <input name="probability" type="number" defaultValue={deal.probability} min={0} max={100} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Close</label>
            <input name="expectedClose" type="date" defaultValue={deal.expectedClose} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" defaultValue={deal.description} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Task Form
export function AddTaskForm({ dealId, contactId }: { dealId: string; contactId?: string }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", type: "FOLLOW_UP", priority: "MEDIUM", dueDate: "", description: "",
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error("Task title required"); return }
    setSaving(true)
    try {
      await addDealTask(dealId, {
        title: form.title,
        type: form.type,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        description: form.description || undefined,
        contactId,
      })
      toast.success("Task created")
      setShow(false)
      setForm({ title: "", type: "FOLLOW_UP", priority: "MEDIUM", dueDate: "", description: "" })
      router.refresh()
    } catch {
      toast.error("Failed to create task")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Task
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add Task</h2>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => update("title", e.target.value)} required placeholder="e.g. Send proposal to client" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={e => update("type", e.target.value)} className={inputCls}>
                <option value="FOLLOW_UP">Follow Up</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="SEND_PROPOSAL">Send Proposal</option>
                <option value="DOCUMENT">Document</option>
                <option value="PAYMENT">Payment</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => update("priority", e.target.value)} className={inputCls}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => update("dueDate", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} placeholder="Optional details..." className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShow(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Creating..." : "Create Task"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Create Booking from Deal button
export function CreateBookingButton({ dealId, contactId, currency }: { dealId: string; contactId?: string; currency: string }) {
  const router = useRouter()

  function handleClick() {
    const params = new URLSearchParams()
    if (dealId) params.set("dealId", dealId)
    if (contactId) params.set("contactId", contactId)
    router.push(`/bookings/new?${params.toString()}`)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      <ListTodo className="w-4 h-4" />
      Create Booking
    </button>
  )
}

// Main DealActions component
export function DealActions({ dealId, currentStatus, deal }: {
  dealId: string
  currentStatus: string
  deal: { title: string; value: number; currency: string; probability: number; priority: string; description: string; expectedClose: string; stageId: string }
}) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleMarkWon() {
    setUpdating(true)
    await updateDeal(dealId, { status: "WON" })
    router.refresh()
    setUpdating(false)
  }

  async function handleMarkLost() {
    const reason = window.prompt("Reason for losing this deal (optional):")
    if (reason === null) return
    setUpdating(true)
    await updateDeal(dealId, { status: "LOST", lostReason: reason || undefined })
    router.refresh()
    setUpdating(false)
  }

  async function handleReopen() {
    setUpdating(true)
    await updateDeal(dealId, { status: "OPEN" })
    router.refresh()
    setUpdating(false)
  }

  async function handleDelete() {
    setUpdating(true)
    await deleteDeal(dealId)
    router.push("/deals")
  }

  return (
    <>
      <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <Pencil className="w-4 h-4" /> Edit
      </button>

      {currentStatus === "OPEN" && (
        <>
          <button onClick={handleMarkWon} disabled={updating} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
            <Check className="w-4 h-4" /> Mark Won
          </button>
          <button onClick={handleMarkLost} disabled={updating} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
            <X className="w-4 h-4" /> Mark Lost
          </button>
        </>
      )}

      {(currentStatus === "WON" || currentStatus === "LOST") && (
        <button onClick={handleReopen} disabled={updating} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50">
          Reopen
        </button>
      )}

      <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-auto">
        <Trash2 className="w-4 h-4" /> Delete
      </button>

      {showEdit && (
        <EditDealModal dealId={dealId} deal={deal} onClose={() => setShowEdit(false)} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-base font-bold text-gray-900">Delete Deal</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this deal? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={updating} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">{updating ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

