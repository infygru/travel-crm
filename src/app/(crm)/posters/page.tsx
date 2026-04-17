"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import {
  Palette,
  Plus,
  ExternalLink,
  Trash2,
  Link2,
  Image,
  Presentation,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
} from "lucide-react"
import { getCanvaDesigns, createDesignViaCanva, deleteCanvaDesign } from "@/lib/actions/canva"
import { useSearchParams } from "next/navigation"

type DesignType = "POSTER" | "FLYER" | "PRESENTATION"

interface CanvaDesignRecord {
  id: string
  canvaId: string
  title: string
  designType: string
  thumbnailUrl: string | null
  editUrl: string | null
  exportUrl: string | null
  status: string
  createdAt: Date
  contact: { id: string; firstName: string; lastName: string } | null
  itinerary: { id: string; title: string } | null
  createdBy: { id: string; name: string | null } | null
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  POSTER: Image,
  FLYER: FileText,
  PRESENTATION: Presentation,
}

const TYPE_COLORS: Record<string, string> = {
  POSTER: "bg-purple-100 text-purple-700 border border-purple-200",
  FLYER: "bg-blue-100 text-blue-700 border border-blue-200",
  PRESENTATION: "bg-amber-100 text-amber-700 border border-amber-200",
}

function PostersContent() {
  const searchParams = useSearchParams()
  const connected = searchParams.get("connected") === "true"

  const [designs, setDesigns] = useState<CanvaDesignRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formType, setFormType] = useState<DesignType>("POSTER")
  const [formContactId, setFormContactId] = useState("")
  const [formItineraryId, setFormItineraryId] = useState("")

  const loadDesigns = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCanvaDesigns()
      setDesigns(data as CanvaDesignRecord[])
    } catch {
      // not authenticated
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDesigns()
  }, [loadDesigns])

  const handleCreate = async () => {
    if (!formTitle.trim()) return
    setCreating(true)
    try {
      const result = await createDesignViaCanva({
        title: formTitle.trim(),
        designType: formType,
        contactId: formContactId || undefined,
        itineraryId: formItineraryId || undefined,
      })
      setFormTitle("")
      setFormType("POSTER")
      setFormContactId("")
      setFormItineraryId("")
      setShowCreateDialog(false)
      await loadDesigns()
      // If Canva returned an edit URL, open it in a new tab
      if (result.editUrl) {
        window.open(result.editUrl, "_blank", "noopener,noreferrer")
      }
    } catch {
      alert("Failed to create design. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return
    setDeleting(id)
    try {
      await deleteCanvaDesign(id)
      setDesigns((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert("Failed to delete design.")
    } finally {
      setDeleting(null)
    }
  }

  // Stats
  const totalDesigns = designs.length
  const sharedDesigns = designs.filter((d) => d.status === "SHARED").length
  const thisMonth = designs.filter((d) => {
    const created = new Date(d.createdAt)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Poster Studio</h1>
            <p className="text-gray-500 text-sm">Create and manage travel posters with Canva</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/canva/connect"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Connect Canva
          </a>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Create New Poster
          </button>
        </div>
      </div>

      {/* Connected Banner */}
      {connected && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700 text-sm font-medium">
            Canva connected successfully! New designs will open directly in the Canva editor.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Designs", value: totalDesigns, color: "from-indigo-500 to-purple-500", icon: Palette },
          { label: "Shared Designs", value: sharedDesigns, color: "from-blue-500 to-cyan-500", icon: Link2 },
          { label: "This Month", value: thisMonth, color: "from-amber-500 to-orange-500", icon: Plus },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Design Gallery */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : designs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
            <Palette className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Designs Yet</h3>
          <p className="text-gray-500 text-base max-w-md mx-auto mb-6 leading-relaxed">
            Connect Canva to create designs directly in the Canva editor, or create a placeholder to track offline designs.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/api/canva/connect"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 font-semibold text-sm hover:bg-purple-100 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Connect Canva
            </a>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Design
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Your Designs</h2>
            <button
              onClick={loadDesigns}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {designs.map((design) => {
              const TypeIcon = TYPE_ICONS[design.designType] ?? Image
              return (
                <div key={design.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Thumbnail / Placeholder */}
                  <div className="h-44 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border-b border-gray-100 relative">
                    {design.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={design.thumbnailUrl}
                        alt={design.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-2 border border-purple-100">
                          <TypeIcon className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-xs text-gray-400">No preview</p>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold ${design.status === "SHARED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {design.status}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{design.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(design.createdAt).toLocaleDateString()}
                          {design.createdBy?.name ? ` · ${design.createdBy.name}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[design.designType] ?? "bg-gray-100 text-gray-600"}`}>
                        {design.designType}
                      </span>
                    </div>

                    {(design.contact || design.itinerary) && (
                      <div className="space-y-1 mb-3">
                        {design.contact && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {design.contact.firstName} {design.contact.lastName}
                          </div>
                        )}
                        {design.itinerary && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {design.itinerary.title}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {design.editUrl ? (
                        <a
                          href={design.editUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Edit in Canva
                        </a>
                      ) : (
                        <div className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No edit URL
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(design.id)}
                        disabled={deleting === design.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Create New Design</h2>
              </div>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Design Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Bali Paradise 7-Day Poster"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Design Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["POSTER", "FLYER", "PRESENTATION"] as DesignType[]).map((type) => {
                    const Icon = TYPE_ICONS[type]
                    return (
                      <button
                        key={type}
                        onClick={() => setFormType(type)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formType === type
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Link to Contact <span className="text-gray-400 font-normal">(optional — paste contact ID)</span>
                </label>
                <input
                  type="text"
                  value={formContactId}
                  onChange={(e) => setFormContactId(e.target.value)}
                  placeholder="Contact ID"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Link to Itinerary <span className="text-gray-400 font-normal">(optional — paste itinerary ID)</span>
                </label>
                <input
                  type="text"
                  value={formItineraryId}
                  onChange={(e) => setFormItineraryId(e.target.value)}
                  placeholder="Itinerary ID"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>

              {connected ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  ✓ Canva is connected. The design will open in the Canva editor after creation.
                </div>
              ) : (
                <div className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  💡 <a href="/api/canva/connect" className="text-amber-700 font-medium hover:underline">Connect Canva</a> to open designs directly in the editor. Without connection, a local record will be saved.
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formTitle.trim() || creating}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "Creating..." : connected ? "Create & Open in Canva" : "Create Design"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PostersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <PostersContent />
    </Suspense>
  )
}
