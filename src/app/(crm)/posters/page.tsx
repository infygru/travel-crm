"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import {
  Palette,
  Plus,
  ExternalLink,
  Trash2,
  Link2,
  Wand2,
  Settings,
  CheckCircle,
  RefreshCw,
  X,
  AlertTriangle,
  MapPin,
  Calendar,
  ChevronRight,
  ImageIcon,
} from "lucide-react"
import {
  getCanvaDesigns,
  deleteCanvaDesign,
  generatePosterFromItinerary,
  saveCanvaTemplateId,
  getCanvaTemplateId,
  getCanvaToken,
  getBrandTemplates,
} from "@/lib/actions/canva"
import { useSearchParams } from "next/navigation"

interface ItineraryRecord {
  id: string
  title: string
  startDate: string | null
  endDate: string | null
  status: string
  contact: { firstName: string; lastName: string } | null
  _count?: { days: number }
}

interface CanvaDesignRecord {
  id: string
  canvaId: string
  title: string
  designType: string
  thumbnailUrl: string | null
  editUrl: string | null
  status: string
  createdAt: Date
  itinerary: { id: string; title: string } | null
  createdBy: { id: string; name: string | null } | null
}

interface BrandTemplate {
  id: string
  title: string
  thumbnail?: { url: string }
}

async function fetchItineraries(): Promise<ItineraryRecord[]> {
  const res = await fetch("/api/itineraries/list")
  if (!res.ok) return []
  return res.json()
}

function PostersContent() {
  const searchParams = useSearchParams()
  const connected = searchParams.get("connected") === "true"

  const [itineraries, setItineraries] = useState<ItineraryRecord[]>([])
  const [designs, setDesigns] = useState<CanvaDesignRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [canvaConnected, setCanvaConnected] = useState(false)
  const [templateId, setTemplateId] = useState("")
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [brandTemplates, setBrandTemplates] = useState<BrandTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [its, ds, token, tmpl] = await Promise.all([
        fetchItineraries(),
        getCanvaDesigns(),
        getCanvaToken(),
        getCanvaTemplateId(),
      ])
      setItineraries(its)
      setDesigns(ds as CanvaDesignRecord[])
      setCanvaConnected(!!token)
      setSavedTemplateId(tmpl)
      setTemplateId(tmpl ?? "")
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleLoadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const result = await getBrandTemplates()
      setBrandTemplates(result?.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates")
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateId.trim()) return
    setSavingTemplate(true)
    try {
      await saveCanvaTemplateId(templateId.trim())
      setSavedTemplateId(templateId.trim())
      setShowSettings(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save template")
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleGenerate = async (itineraryId: string) => {
    setGeneratingFor(itineraryId)
    setError(null)
    try {
      const result = await generatePosterFromItinerary(itineraryId)
      await loadAll()
      window.open(result.editUrl, "_blank", "noopener,noreferrer")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate poster")
    } finally {
      setGeneratingFor(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this design?")) return
    setDeleting(id)
    try {
      await deleteCanvaDesign(id)
      setDesigns((prev) => prev.filter((d) => d.id !== id))
    } catch {
      setError("Failed to delete design")
    } finally {
      setDeleting(null)
    }
  }

  const getDesignsForItinerary = (itineraryId: string) =>
    designs.filter((d) => d.itinerary?.id === itineraryId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

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
            <p className="text-gray-500 text-sm">Auto-generate travel posters from your itineraries using Canva</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!canvaConnected ? (
            <a
              href="/api/canva/connect"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Connect Canva
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Canva Connected
            </span>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Template Settings
          </button>
        </div>
      </div>

      {/* Banners */}
      {connected && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700 text-sm font-medium">Canva connected successfully!</p>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}
      {!savedTemplateId && canvaConnected && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-sm font-medium">
              No Canva template configured. Click <strong>Template Settings</strong> to set up your travel poster template.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex-shrink-0"
          >
            Configure
          </button>
        </div>
      )}

      {/* Itineraries */}
      {itineraries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Palette className="w-10 h-10 text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Itineraries Found</h3>
          <p className="text-gray-500 text-sm">Create itineraries first, then generate posters from them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">Your Itineraries</h2>
          <div className="grid grid-cols-1 gap-4">
            {itineraries.map((itinerary) => {
              const itineraryDesigns = getDesignsForItinerary(itinerary.id)
              const isGenerating = generatingFor === itinerary.id

              return (
                <div key={itinerary.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5 gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{itinerary.title}</h3>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {itinerary.contact && (
                            <span className="text-xs text-gray-500">{itinerary.contact.firstName} {itinerary.contact.lastName}</span>
                          )}
                          {(itinerary.startDate || itinerary.endDate) && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {itinerary.startDate ? new Date(itinerary.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                              {itinerary.endDate ? ` – ${new Date(itinerary.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            itinerary.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                            itinerary.status === "SHARED" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{itinerary.status}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerate(itinerary.id)}
                      disabled={isGenerating || !canvaConnected || !savedTemplateId}
                      title={!canvaConnected ? "Connect Canva first" : !savedTemplateId ? "Configure a template first" : "Generate poster"}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      {isGenerating ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" />Generating...</>
                      ) : (
                        <><Wand2 className="w-4 h-4" />Generate Poster</>
                      )}
                    </button>
                  </div>

                  {/* Existing designs for this itinerary */}
                  {itineraryDesigns.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Generated Posters</p>
                      <div className="flex gap-3 flex-wrap">
                        {itineraryDesigns.map((design) => (
                          <div key={design.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm">
                            <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-gray-700 font-medium truncate max-w-[160px]">{design.title}</span>
                            <span className="text-xs text-gray-400">{new Date(design.createdAt).toLocaleDateString()}</span>
                            {design.editUrl && (
                              <a href={design.editUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(design.id)}
                              disabled={deleting === design.id}
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Canva Template Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Instructions */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 space-y-2">
                <p className="font-semibold">How to set up your template:</p>
                <ol className="list-decimal list-inside space-y-1 text-indigo-700">
                  <li>Create a travel poster template in Canva</li>
                  <li>Add text elements and name them: <code className="bg-indigo-100 px-1 rounded text-xs">destination</code>, <code className="bg-indigo-100 px-1 rounded text-xs">dates</code>, <code className="bg-indigo-100 px-1 rounded text-xs">duration</code>, <code className="bg-indigo-100 px-1 rounded text-xs">highlights</code></li>
                  <li>Save it as a <strong>Brand Template</strong> in Canva</li>
                  <li>Copy the template ID from the URL and paste below</li>
                </ol>
              </div>

              {/* Browse templates */}
              {canvaConnected && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Browse Your Brand Templates</label>
                    <button
                      onClick={handleLoadTemplates}
                      disabled={loadingTemplates}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      {loadingTemplates ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Load
                    </button>
                  </div>
                  {brandTemplates.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {brandTemplates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTemplateId(t.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors ${templateId === t.id ? "bg-indigo-50" : ""}`}
                        >
                          {t.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.thumbnail.url} alt={t.title} className="w-10 h-8 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-8 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                            <p className="text-xs text-gray-400 truncate">{t.id}</p>
                          </div>
                          {templateId === t.id && <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Template ID</label>
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="e.g. DAFxxxxxx"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <button onClick={() => setShowSettings(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateId.trim() || savingTemplate}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingTemplate ? "Saving..." : "Save Template"}
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
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <PostersContent />
    </Suspense>
  )
}
