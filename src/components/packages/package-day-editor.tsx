"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPackageDay, updatePackageDay, removePackageDay } from "@/lib/actions/packages";
import { Plus, Pencil, Trash2, Check, X, Hotel, Car, Utensils, Zap, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type PackageDay = {
  id: string;
  day: number;
  title: string;
  location: string | null;
  description: string | null;
  accommodation: string | null;
  transport: string | null;
  meals: string[];
  activities: string[];
};

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

function TagInput({ label, items, onChange, placeholder, icon: Icon, color }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  icon: React.ElementType;
  color: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const val = input.trim();
    if (!val) return;
    onChange([...items, val]);
    setInput("");
  }
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 ${color}`}>{label}</label>
      <div className="flex gap-1.5 mb-1.5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="button" onClick={add} className="px-2.5 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
            <Icon className={`w-3 h-3 ${color}`} />
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="ml-0.5 text-gray-400 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, packageId, onRefresh }: { day: PackageDay; packageId: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [form, setForm] = useState({
    title: day.title,
    location: day.location ?? "",
    description: day.description ?? "",
    accommodation: day.accommodation ?? "",
    transport: day.transport ?? "",
    meals: [...day.meals],
    activities: [...day.activities],
  });

  async function handleSave() {
    setSaving(true);
    try {
      await updatePackageDay(day.id, packageId, {
        title: form.title,
        location: form.location || undefined,
        description: form.description || undefined,
        accommodation: form.accommodation || undefined,
        transport: form.transport || undefined,
        meals: form.meals,
        activities: form.activities,
      });
      toast.success(`Day ${day.day} updated`);
      setEditing(false);
      onRefresh();
    } catch {
      toast.error("Failed to save day");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove Day ${day.day}?`)) return;
    try {
      await removePackageDay(day.id, packageId);
      toast.success(`Day ${day.day} removed`);
      onRefresh();
    } catch {
      toast.error("Failed to remove day");
    }
  }

  if (editing) {
    return (
      <div className="border border-indigo-200 rounded-xl bg-indigo-50/30 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Day {day.day}</h3>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Day Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Dubai Marina" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Day Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Describe what happens this day..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Hotel className="w-3 h-3 text-purple-500" /> Hotel / Accommodation</label>
            <input value={form.accommodation} onChange={e => setForm(f => ({ ...f, accommodation: e.target.value }))} placeholder="e.g. Burj Al Arab" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Car className="w-3 h-3 text-green-500" /> Transport</label>
            <input value={form.transport} onChange={e => setForm(f => ({ ...f, transport: e.target.value }))} placeholder="e.g. Airport transfer by AC bus" className={inputCls} />
          </div>
        </div>
        <TagInput label="Activities" items={form.activities} onChange={v => setForm(f => ({ ...f, activities: v }))} placeholder="e.g. Desert safari, Burj Khalifa visit" icon={Zap} color="text-orange-500" />
        <TagInput label="Meals" items={form.meals} onChange={v => setForm(f => ({ ...f, meals: v }))} placeholder="e.g. Breakfast, Gala dinner" icon={Utensils} color="text-red-500" />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
            {day.day}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{day.title}</h3>
            {day.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{day.location}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setExpanded(e => !e)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={handleRemove} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {day.description && <p className="text-sm text-gray-600 leading-relaxed">{day.description}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {day.accommodation && (
              <div className="flex items-start gap-2">
                <Hotel className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Hotel</p>
                  <p className="text-sm text-gray-800">{day.accommodation}</p>
                </div>
              </div>
            )}
            {day.transport && (
              <div className="flex items-start gap-2">
                <Car className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Transport</p>
                  <p className="text-sm text-gray-800">{day.transport}</p>
                </div>
              </div>
            )}
          </div>
          {day.activities.length > 0 && (
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Activities</p>
                <div className="flex flex-wrap gap-1.5">
                  {day.activities.map((a, i) => (
                    <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {day.meals.length > 0 && (
            <div className="flex items-start gap-2">
              <Utensils className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Meals</p>
                <div className="flex flex-wrap gap-1.5">
                  {day.meals.map((m, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!day.accommodation && !day.transport && day.activities.length === 0 && day.meals.length === 0 && !day.description && (
            <p className="text-xs text-gray-400 italic">No details yet — click the edit button to add hotel, transport, activities and meals</p>
          )}
        </div>
      )}
    </div>
  );
}

function AddDayForm({ packageId, nextDay, onRefresh }: { packageId: string; nextDay: number; onRefresh: () => void }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    accommodation: "",
    transport: "",
    meals: [] as string[],
    activities: [] as string[],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error("Day title is required"); return; }
    setSaving(true);
    try {
      await addPackageDay(packageId, {
        day: nextDay,
        title: form.title,
        location: form.location || undefined,
        description: form.description || undefined,
        accommodation: form.accommodation || undefined,
        transport: form.transport || undefined,
        meals: form.meals,
        activities: form.activities,
      });
      toast.success(`Day ${nextDay} added`);
      setShow(false);
      setForm({ title: "", location: "", description: "", accommodation: "", transport: "", meals: [], activities: [] });
      onRefresh();
    } catch {
      toast.error("Failed to add day");
    } finally {
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 border-dashed rounded-xl hover:bg-indigo-100 transition-colors w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        Add Day {nextDay}
      </button>
    );
  }

  return (
    <div className="border border-indigo-200 rounded-xl bg-indigo-50/30 p-4 space-y-4">
      <h3 className="text-sm font-bold text-gray-900">Day {nextDay}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Day Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Arrival in Dubai" className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Dubai" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="What happens this day..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Hotel className="w-3 h-3 text-purple-500" /> Hotel / Accommodation</label>
            <input value={form.accommodation} onChange={e => setForm(f => ({ ...f, accommodation: e.target.value }))} placeholder="e.g. Atlantis The Palm" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Car className="w-3 h-3 text-green-500" /> Transport</label>
            <input value={form.transport} onChange={e => setForm(f => ({ ...f, transport: e.target.value }))} placeholder="e.g. Private transfer" className={inputCls} />
          </div>
        </div>
        <TagInput label="Activities" items={form.activities} onChange={v => setForm(f => ({ ...f, activities: v }))} placeholder="e.g. Burj Khalifa visit" icon={Zap} color="text-orange-500" />
        <TagInput label="Meals" items={form.meals} onChange={v => setForm(f => ({ ...f, meals: v }))} placeholder="e.g. Breakfast included" icon={Utensils} color="text-red-500" />
        <div className="flex gap-2">
          <button type="button" onClick={() => setShow(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Adding..." : "Add Day"}</button>
        </div>
      </form>
    </div>
  );
}

export function PackageDayEditor({ packageId, initialDays }: { packageId: string; initialDays: PackageDay[] }) {
  const router = useRouter();
  const [days] = useState<PackageDay[]>(initialDays);

  function refresh() {
    router.refresh();
  }

  const nextDay = days.length > 0 ? Math.max(...days.map(d => d.day)) + 1 : 1;

  return (
    <div className="space-y-3">
      {days.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          No days defined yet. Add Day 1 to start building the programme.
        </div>
      )}
      {days.map(day => (
        <DayCard key={day.id} day={day} packageId={packageId} onRefresh={refresh} />
      ))}
      <AddDayForm packageId={packageId} nextDay={nextDay} onRefresh={refresh} />
    </div>
  );
}
