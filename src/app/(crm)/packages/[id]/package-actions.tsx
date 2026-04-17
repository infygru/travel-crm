"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updatePackage } from "@/lib/actions/packages"
import { Pencil, X, ToggleLeft, ToggleRight, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

const CATEGORIES = [
  "ADVENTURE","LUXURY","FAMILY","HONEYMOON","BUSINESS",
  "GROUP_TOUR","CRUISE","SAFARI","BEACH","CULTURAL","PILGRIMAGE","SPORTS","OTHER"
]

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"

type PkgData = {
  name: string
  code?: string | null
  category: string
  description?: string | null
  duration: number
  basePrice: number
  currency: string
  maxPax?: number | null
  destinations: string[]
  inclusions: string[]
  exclusions: string[]
  highlights: string[]
  isActive: boolean
  imageUrl?: string | null
}

// Reusable list editor (inclusions, exclusions, highlights)
function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState("")

  function addItem() {
    const val = input.trim()
    if (!val || items.includes(val)) return
    onChange([...items, val])
    setInput("")
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem() } }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={addItem}
          className="flex-shrink-0 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700">
              <span>{item}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 ml-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EditPackageModal({ packageId, pkg, onClose }: {
  packageId: string
  pkg: PkgData
  onClose: () => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [inclusions, setInclusions] = useState<string[]>(pkg.inclusions)
  const [exclusions, setExclusions] = useState<string[]>(pkg.exclusions)
  const [highlights, setHighlights] = useState<string[]>(pkg.highlights)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const destinationsRaw = fd.get("destinations") as string
    try {
      await updatePackage(packageId, {
        name: fd.get("name") as string,
        code: fd.get("code") as string || undefined,
        category: fd.get("category") as string,
        description: fd.get("description") as string || undefined,
        duration: Number(fd.get("duration")),
        basePrice: Number(fd.get("basePrice")),
        currency: fd.get("currency") as string,
        maxPax: fd.get("maxPax") ? Number(fd.get("maxPax")) : undefined,
        destinations: destinationsRaw ? destinationsRaw.split(",").map(d => d.trim()).filter(Boolean) : [],
        inclusions,
        exclusions,
        highlights,
        imageUrl: fd.get("imageUrl") as string || undefined,
      })
      toast.success("Package updated")
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update package")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Package</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Package Name <span className="text-red-500">*</span></label>
            <input name="name" required defaultValue={pkg.name} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Code</label>
              <input name="code" defaultValue={pkg.code ?? ""} className={`${inputCls} font-mono`} placeholder="PKG001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" defaultValue={pkg.category} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Destinations (comma-separated)</label>
            <input name="destinations" defaultValue={pkg.destinations.join(", ")} className={inputCls} placeholder="Paris, Rome, Barcelona" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (days)</label>
              <input name="duration" type="number" min={1} defaultValue={pkg.duration} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Pax</label>
              <input name="maxPax" type="number" min={1} defaultValue={pkg.maxPax ?? ""} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select name="currency" defaultValue={pkg.currency} className={inputCls}>
                {["INR","USD","EUR","GBP","AED","SGD","AUD"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price</label>
            <input name="basePrice" type="number" min={0} step="0.01" defaultValue={pkg.basePrice} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Image URL</label>
            <input name="imageUrl" type="url" defaultValue={pkg.imageUrl ?? ""} placeholder="https://example.com/image.jpg" className={inputCls} />
            <p className="mt-1 text-xs text-gray-400">Cover image shown on package cards and PDF brochure</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" defaultValue={pkg.description ?? ""} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Package Details</p>
            <ListEditor
              label="Highlights"
              items={highlights}
              onChange={setHighlights}
              placeholder="e.g. Guided tour of Eiffel Tower"
            />
            <ListEditor
              label="Inclusions"
              items={inclusions}
              onChange={setInclusions}
              placeholder="e.g. Return flights, Hotel accommodation"
            />
            <ListEditor
              label="Exclusions"
              items={exclusions}
              onChange={setExclusions}
              placeholder="e.g. Travel insurance, Visa fees"
            />
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

export function PackageActions({ packageId, pkg }: { packageId: string; pkg: PkgData }) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleToggleActive() {
    setToggling(true)
    try {
      await updatePackage(packageId, { isActive: !pkg.isActive })
      toast.success(pkg.isActive ? "Package deactivated" : "Package activated")
      router.refresh()
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      <button
        onClick={handleToggleActive}
        disabled={toggling}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
          pkg.isActive
            ? "text-gray-600 border-gray-200 hover:bg-gray-50"
            : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
        }`}
      >
        {pkg.isActive
          ? <><ToggleRight className="w-4 h-4 text-green-500" /> Active</>
          : <><ToggleLeft className="w-4 h-4" /> Inactive</>
        }
      </button>
      <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <Pencil className="w-4 h-4" /> Edit Package
      </button>

      {showEdit && <EditPackageModal packageId={packageId} pkg={pkg} onClose={() => setShowEdit(false)} />}
    </>
  )
}
