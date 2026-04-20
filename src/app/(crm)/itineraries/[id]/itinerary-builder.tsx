"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDayPlan,
  removeDayPlan,
  updateDayPlan,
  addItineraryItem,
  removeItineraryItem,
  shareItinerary,
  importDaysFromPackage,
} from "@/lib/actions/itineraries";
import { generatePosterFromItinerary } from "@/lib/actions/canva";
import { enhanceDayDescription, autoWriteDay, enhanceItemDescription } from "@/lib/actions/ai-itinerary";
import { toast } from "sonner";
import { useFmt } from "@/components/currency-provider";
import {
  Plus, Trash2, Share2, Plane, Hotel, Zap, Car, Utensils, Sunrise, Tag,
  Palette, ExternalLink, Pencil, Check, X, Printer, Mail, Package, Sparkles,
} from "lucide-react";

type ItineraryItem = {
  id: string;
  order: number;
  type: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  supplier: string | null;
  confirmationRef: string | null;
  unitCost: number;
  quantity: number;
  totalCost: number;
  currency: string;
  isIncluded: boolean;
  notes: string | null;
};

type DayPlan = {
  id: string;
  dayNumber: number;
  date: Date | null;
  title: string | null;
  description: string | null;
  location: string | null;
  items: ItineraryItem[];
};

type Itinerary = {
  id: string;
  title: string;
  status: string;
  currency: string;
  totalCost: number;
  shareToken: string | null;
  days: DayPlan[];
  deal?: { id: string; title: string; packageId?: string | null } | null;
};

interface ItineraryBuilderProps {
  itinerary: Itinerary;
  contactEmail?: string | null;
  contactName?: string | null;
}

const ITEM_TYPES = [
  { value: "FLIGHT",    label: "Flight",    icon: Plane,    color: "text-blue-500" },
  { value: "HOTEL",     label: "Hotel",     icon: Hotel,    color: "text-purple-500" },
  { value: "ACTIVITY",  label: "Activity",  icon: Zap,      color: "text-orange-500" },
  { value: "TRANSFER",  label: "Transfer",  icon: Car,      color: "text-green-500" },
  { value: "MEAL",      label: "Meal",      icon: Utensils, color: "text-red-500" },
  { value: "FREE_TIME", label: "Free Time", icon: Sunrise,  color: "text-yellow-500" },
  { value: "OTHER",     label: "Other",     icon: Tag,      color: "text-gray-500" },
];

function getItemTypeConfig(type: string) {
  return ITEM_TYPES.find((t) => t.value === type) ?? ITEM_TYPES[6];
}

const EMPTY_ITEM_FORM = {
  type: "ACTIVITY",
  title: "",
  description: "",
  location: "",
  startTime: "",
  endTime: "",
  supplier: "",
  confirmationRef: "",
  unitCost: 0,
  quantity: 1,
  isIncluded: true,
  notes: "",
};

const inputCls = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function ItineraryBuilder({ itinerary, contactEmail, contactName }: ItineraryBuilderProps) {
  const router = useRouter();
  const fmt = useFmt();
  const [addingDay, setAddingDay] = useState(false);
  const [addingItemFor, setAddingItemFor] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [sharing, setSharing] = useState(false);
  const [creatingPoster, setCreatingPoster] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);

  // Day editing state
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [dayEditForm, setDayEditForm] = useState({ title: "", location: "", date: "", description: "" });
  const [savingDay, setSavingDay] = useState(false);

  // AI state
  const [aiPending, startAiTransition] = useTransition();
  const [enhancingDayId, setEnhancingDayId] = useState<string | null>(null);
  const [autoWritingDayId, setAutoWritingDayId] = useState<string | null>(null);
  const [autoWritePrompt, setAutoWritePrompt] = useState("");
  const [showAutoWriteDialogFor, setShowAutoWriteDialogFor] = useState<string | null>(null);
  const [enhancingItem, setEnhancingItem] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = itinerary.shareToken ? `${appUrl}/itinerary/${itinerary.shareToken}` : null;

  async function handleAddDay() {
    setAddingDay(true);
    try {
      const nextDay = Math.max(0, ...itinerary.days.map((d) => d.dayNumber)) + 1;
      await addDayPlan(itinerary.id, { dayNumber: nextDay });
      toast.success(`Day ${nextDay} added`);
      router.refresh();
    } catch {
      toast.error("Failed to add day");
    } finally {
      setAddingDay(false);
    }
  }

  async function handleRemoveDay(dayPlanId: string) {
    if (!confirm("Remove this day and all its items?")) return;
    try {
      await removeDayPlan(dayPlanId);
      toast.success("Day removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove day");
    }
  }

  function startEditDay(day: DayPlan) {
    setEditingDayId(day.id);
    setDayEditForm({
      title: day.title ?? "",
      location: day.location ?? "",
      date: day.date ? new Date(day.date).toISOString().split("T")[0] : "",
      description: day.description ?? "",
    });
  }

  async function handleSaveDayEdit(dayId: string) {
    setSavingDay(true);
    try {
      await updateDayPlan(dayId, {
        title: dayEditForm.title || undefined,
        location: dayEditForm.location || undefined,
        date: dayEditForm.date || undefined,
        description: dayEditForm.description || undefined,
      });
      toast.success("Day updated");
      setEditingDayId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update day");
    } finally {
      setSavingDay(false);
    }
  }

  async function handleAddItem(dayPlanId: string) {
    if (!itemForm.title) { toast.error("Title is required"); return; }
    try {
      await addItineraryItem(dayPlanId, {
        ...itemForm,
        unitCost: Number(itemForm.unitCost),
        quantity: Number(itemForm.quantity),
        currency: itinerary.currency,
      });
      toast.success("Item added");
      setAddingItemFor(null);
      setItemForm(EMPTY_ITEM_FORM);
      router.refresh();
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm("Remove this item?")) return;
    try {
      await removeItineraryItem(itemId);
      toast.success("Item removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove item");
    }
  }

  async function handleShare() {
    const hasEmail = !!contactEmail;
    const msg = hasEmail
      ? `Share this itinerary with ${contactName ?? "the client"}? They will receive an email with a link to view and approve it.`
      : "Share this itinerary? A shareable link will be generated (no email — this contact has no email address on file).";
    if (!confirm(msg)) return;
    setSharing(true);
    try {
      const updated = await shareItinerary(itinerary.id);
      if (hasEmail) {
        toast.success(`Itinerary sent to ${contactEmail}`);
      } else {
        toast.success("Itinerary shared!");
      }
      if (updated.shareToken) {
        const url = `${window.location.origin}/itinerary/${updated.shareToken}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        toast.info("Share link copied to clipboard");
      }
      router.refresh();
    } catch {
      toast.error("Failed to share itinerary");
    } finally {
      setSharing(false);
    }
  }

  async function handleImportFromPackage() {
    if (!itinerary.deal?.packageId) return;
    if (itinerary.days.length > 0 && !confirm("This will replace all existing days with the package template. Continue?")) return;
    setLoadingPackage(true);
    try {
      const result = await importDaysFromPackage(itinerary.id, itinerary.deal.packageId);
      toast.success(`${result.days} days imported from package`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import days");
    } finally {
      setLoadingPackage(false);
    }
  }

  function handleEnhanceDayDescription(day: DayPlan) {
    setEnhancingDayId(day.id);
    startAiTransition(async () => {
      try {
        const enhanced = await enhanceDayDescription({
          title: dayEditForm.title || day.title || undefined,
          location: dayEditForm.location || day.location || undefined,
          description: dayEditForm.description || day.description || undefined,
          items: day.items.map((i) => ({ type: i.type, title: i.title })),
        });
        setDayEditForm((f) => ({ ...f, description: enhanced }));
        toast.success("Description enhanced!");
      } catch {
        toast.error("AI enhance failed");
      } finally {
        setEnhancingDayId(null);
      }
    });
  }

  function handleAutoWriteDay(day: DayPlan) {
    setShowAutoWriteDialogFor(day.id);
    setAutoWritePrompt("");
  }

  function confirmAutoWriteDay(day: DayPlan) {
    setAutoWritingDayId(day.id);
    setShowAutoWriteDialogFor(null);
    startAiTransition(async () => {
      try {
        const result = await autoWriteDay({
          destination: day.location || undefined,
          theme: itinerary.deal?.title || undefined,
          dayNumber: day.dayNumber,
          prompt: autoWritePrompt || undefined,
        });
        setDayEditForm({
          title: result.title,
          description: result.description,
          location: dayEditForm.location || day.location || "",
          date: dayEditForm.date || (day.date ? new Date(day.date).toISOString().split("T")[0] : ""),
        });
        if (!editingDayId) {
          setEditingDayId(day.id);
        }
        toast.success("Day auto-written! Review and save.");
      } catch {
        toast.error("AI auto-write failed");
      } finally {
        setAutoWritingDayId(null);
      }
    });
  }

  function handleEnhanceItemDescription() {
    setEnhancingItem(true);
    startAiTransition(async () => {
      try {
        const enhanced = await enhanceItemDescription({
          type: itemForm.type,
          title: itemForm.title,
          location: itemForm.location || undefined,
          description: itemForm.description || undefined,
        });
        setItemForm((f) => ({ ...f, description: enhanced }));
        toast.success("Description enhanced!");
      } catch {
        toast.error("AI enhance failed");
      } finally {
        setEnhancingItem(false);
      }
    });
  }

  async function handleCreatePoster() {
    setCreatingPoster(true);
    try {
      const result = await generatePosterFromItinerary(itinerary.id);
      if (result.editUrl) {
        toast.success("Poster created! Opening Canva editor...");
        window.open(result.editUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.success("Poster saved. Connect Canva to edit designs.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create poster");
    } finally {
      setCreatingPoster(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Print / PDF */}
          {publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Preview / Print PDF
            </a>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
              <Printer className="w-4 h-4" />
              Print PDF (share first)
            </span>
          )}

          {/* Canva poster */}
          <button
            onClick={handleCreatePoster}
            disabled={creatingPoster}
            className="flex items-center gap-2 px-3 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <Palette className="w-4 h-4" />
            {creatingPoster ? "Creating..." : "Canva Poster"}
          </button>

          {itinerary.deal?.packageId && (
            <button
              onClick={handleImportFromPackage}
              disabled={loadingPackage}
              className="flex items-center gap-2 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <Package className="w-4 h-4" />
              {loadingPackage ? "Importing..." : "Load Package Days"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Share / Resend */}
          {itinerary.status === "DRAFT" ? (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {contactEmail ? <Mail className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {sharing ? "Sending..." : contactEmail ? `Email to ${contactEmail.split("@")[0]}` : "Share with Client"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {publicUrl && (
                <a
                  href={publicUrl}
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Public Link
                </a>
              )}
              {itinerary.status === "SHARED" && contactEmail && (
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center gap-2 px-3 py-1.5 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {sharing ? "Sending..." : "Resend Email"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Days */}
      {itinerary.days.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">No days added yet. Start building your itinerary.</p>
          <button
            onClick={handleAddDay}
            disabled={addingDay}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors mx-auto disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add First Day
          </button>
        </div>
      ) : (
        itinerary.days.map((day) => (
          <div key={day.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Day header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {day.dayNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {day.title ?? `Day ${day.dayNumber}`}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {day.location && <span className="text-xs text-indigo-600">📍 {day.location}</span>}
                      {day.date && (
                        <span className="text-xs text-gray-500">
                          {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                      )}
                      {day.description && <span className="text-xs text-gray-400 truncate max-w-[200px]">{day.description}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => editingDayId === day.id ? setEditingDayId(null) : startEditDay(day)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  title="Edit day"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemoveDay(day.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove day"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Day edit form */}
            {editingDayId === day.id && (
              <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 space-y-3">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Edit Day {day.dayNumber}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Day Title</label>
                    <input
                      value={dayEditForm.title}
                      onChange={(e) => setDayEditForm({ ...dayEditForm, title: e.target.value })}
                      placeholder={`Day ${day.dayNumber}`}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location / City</label>
                    <input
                      value={dayEditForm.location}
                      onChange={(e) => setDayEditForm({ ...dayEditForm, location: e.target.value })}
                      placeholder="e.g. Paris, France"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={dayEditForm.date}
                      onChange={(e) => setDayEditForm({ ...dayEditForm, date: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <div className="flex gap-1">
                      <input
                        value={dayEditForm.description}
                        onChange={(e) => setDayEditForm({ ...dayEditForm, description: e.target.value })}
                        placeholder="Brief overview of the day..."
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => handleEnhanceDayDescription(day)}
                        disabled={aiPending && enhancingDayId === day.id}
                        title="AI Enhance"
                        className="flex items-center gap-1 px-2 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 disabled:opacity-50 flex-shrink-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        {aiPending && enhancingDayId === day.id ? "..." : "Enhance"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleSaveDayEdit(day.id)}
                    disabled={savingDay}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> {savingDay ? "Saving..." : "Save Day"}
                  </button>
                  <button
                    onClick={() => setEditingDayId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoWriteDay(day)}
                    disabled={aiPending && autoWritingDayId === day.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 disabled:opacity-50 ml-auto"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiPending && autoWritingDayId === day.id ? "Writing..." : "Auto-write Day"}
                  </button>
                </div>
              </div>
            )}

            {/* Auto-write dialog */}
            {showAutoWriteDialogFor === day.id && (
              <div className="px-5 py-4 bg-purple-50 border-b border-purple-100 space-y-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Auto-write Day {day.dayNumber}</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Describe what you want for this day (optional)</label>
                  <input
                    value={autoWritePrompt}
                    onChange={(e) => setAutoWritePrompt(e.target.value)}
                    placeholder="e.g. Romantic sunset dinner, temple visits in the morning..."
                    className={inputCls}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => confirmAutoWriteDay(day)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate
                  </button>
                  <button
                    onClick={() => setShowAutoWriteDialogFor(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {day.items.length === 0 && (
                <div className="px-5 py-4 text-center text-xs text-gray-400">
                  No items yet — add flights, hotels, activities below
                </div>
              )}
              {day.items.map((item) => {
                const typeConfig = getItemTypeConfig(item.type);
                const TypeIcon = typeConfig.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TypeIcon className={`w-3.5 h-3.5 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {!item.isIncluded && (
                          <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded flex-shrink-0">Optional</span>
                        )}
                      </div>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {item.startTime && (
                          <span className="text-xs text-gray-400">
                            {item.startTime}{item.endTime ? ` – ${item.endTime}` : ""}
                          </span>
                        )}
                        {item.location && <span className="text-xs text-gray-400">📍 {item.location}</span>}
                        {item.supplier && <span className="text-xs text-gray-400">· {item.supplier}</span>}
                        {item.confirmationRef && (
                          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            Ref: {item.confirmationRef}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {item.totalCost > 0 && (
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-700">
                            {fmt(item.totalCost)}
                          </span>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-400">{item.quantity} × {fmt(item.unitCost)}</p>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add item form */}
            {addingItemFor === day.id ? (
              <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50 rounded-b-xl">
                <h4 className="text-sm font-semibold text-gray-900">Add Item to Day {day.dayNumber}</h4>

                {/* Type selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ITEM_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, type: t.value })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          itemForm.type === t.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                    <input
                      type="text"
                      value={itemForm.title}
                      onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Flight to Paris"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                    <input
                      type="text"
                      value={itemForm.location}
                      onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                      className={inputCls}
                      placeholder="City or address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                    <input type="time" value={itemForm.startTime} onChange={(e) => setItemForm({ ...itemForm, startTime: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <input type="time" value={itemForm.endTime} onChange={(e) => setItemForm({ ...itemForm, endTime: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Supplier / Airline / Hotel</label>
                    <input
                      type="text"
                      value={itemForm.supplier}
                      onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                      className={inputCls}
                      placeholder="Emirates, Marriott..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirmation Ref / PNR</label>
                    <input
                      type="text"
                      value={itemForm.confirmationRef}
                      onChange={(e) => setItemForm({ ...itemForm, confirmationRef: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. ABC123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Cost ({itinerary.currency})</label>
                    <input
                      type="number"
                      value={itemForm.unitCost}
                      onChange={(e) => setItemForm({ ...itemForm, unitCost: Number(e.target.value) })}
                      min={0}
                      step={0.01}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                      min={1}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description / Notes</label>
                  <div className="flex gap-1 items-start">
                    <textarea
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-none flex-1`}
                      placeholder="Any additional details..."
                    />
                    <button
                      type="button"
                      onClick={handleEnhanceItemDescription}
                      disabled={!itemForm.title || (aiPending && enhancingItem)}
                      title="AI Enhance description"
                      className="flex items-center gap-1 px-2 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 disabled:opacity-50 flex-shrink-0"
                    >
                      <Sparkles className="w-3 h-3" />
                      {aiPending && enhancingItem ? "..." : "Enhance"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.isIncluded}
                      onChange={(e) => setItemForm({ ...itemForm, isIncluded: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-xs text-gray-600 font-medium">Included in package price</span>
                  </label>
                  <span className="text-xs text-gray-500 font-semibold">
                    Total: {fmt(itemForm.unitCost * itemForm.quantity)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleAddItem(day.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Add Item
                  </button>
                  <button
                    onClick={() => { setAddingItemFor(null); setItemForm(EMPTY_ITEM_FORM); }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-3 border-t border-gray-50">
                <button
                  onClick={() => { setAddingItemFor(day.id); setItemForm(EMPTY_ITEM_FORM); }}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {itinerary.days.length > 0 && (
        <button
          onClick={handleAddDay}
          disabled={addingDay}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {addingDay ? "Adding..." : "Add Day"}
        </button>
      )}

      {/* Cost summary */}
      {itinerary.totalCost > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Total Itinerary Cost</p>
            <p className="text-white text-xs mt-0.5 opacity-80">Included items only</p>
          </div>
          <p className="text-white text-2xl font-bold">
            {fmt(itinerary.totalCost)}
          </p>
        </div>
      )}
    </div>
  );
}
