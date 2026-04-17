"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatus, addPayment, updateBooking, addPassenger, removePassenger, addBookingNote, resendBookingConfirmation } from "@/lib/actions/bookings";
import { Check, X, DollarSign, RotateCcw, Loader2, Pencil, Plus, Trash2, MessageSquare, Mail } from "lucide-react";
import { toast } from "sonner";

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

// ── Status Action Buttons ───────────────────────────────────────────────────

export function BookingStatusActions({
  bookingId,
  currentStatus,
  totalAmount,
  paidAmount,
  currency,
}: {
  bookingId: string;
  currentStatus: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      await updateBookingStatus(bookingId, status);
      toast.success(`Booking ${status.toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Failed to update booking status");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Updating...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {currentStatus === "PENDING" && (
        <>
          <button
            onClick={() => changeStatus("CONFIRMED")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Confirm Booking
          </button>
          <button
            onClick={() => changeStatus("CANCELLED")}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </>
      )}
      {currentStatus === "CONFIRMED" && (
        <>
          <button
            onClick={() => changeStatus("IN_PROGRESS")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark In Progress
          </button>
          <button
            onClick={() => changeStatus("CANCELLED")}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </>
      )}
      {currentStatus === "IN_PROGRESS" && (
        <button
          onClick={() => changeStatus("COMPLETED")}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" />
          Mark Completed
        </button>
      )}
      {(currentStatus === "CANCELLED" || currentStatus === "COMPLETED") && (
        <button
          onClick={() => changeStatus("PENDING")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reopen
        </button>
      )}
    </div>
  );
}

// ── Edit Booking Form ────────────────────────────────────────────────────────

export function EditBookingModal({
  bookingId,
  booking,
}: {
  bookingId: string;
  booking: {
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    infants: number;
    totalAmount: number;
    costPrice: number;
    currency: string;
    destinations: string[];
    specialRequests?: string | null;
    internalNotes?: string | null;
  };
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const destsRaw = fd.get("destinations") as string;
    try {
      await updateBooking(bookingId, {
        startDate: fd.get("startDate") as string,
        endDate: fd.get("endDate") as string,
        adults: Number(fd.get("adults")),
        children: Number(fd.get("children")),
        infants: Number(fd.get("infants")),
        totalAmount: Number(fd.get("totalAmount")),
        costPrice: Number(fd.get("costPrice")),
        currency: fd.get("currency") as string,
        destinations: destsRaw ? destsRaw.split(",").map(d => d.trim()).filter(Boolean) : [],
        specialRequests: (fd.get("specialRequests") as string) || undefined,
        internalNotes: (fd.get("internalNotes") as string) || undefined,
      });
      toast.success("Booking updated");
      setShow(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Pencil className="w-4 h-4" /> Edit Booking
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Booking</h2>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
              <input name="startDate" type="date" required defaultValue={booking.startDate} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
              <input name="endDate" type="date" required defaultValue={booking.endDate} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adults</label>
              <input name="adults" type="number" min={1} defaultValue={booking.adults} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Children</label>
              <input name="children" type="number" min={0} defaultValue={booking.children} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Infants</label>
              <input name="infants" type="number" min={0} defaultValue={booking.infants} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price (Client Pays) <span className="text-red-500">*</span></label>
              <input name="totalAmount" type="number" min={0} step="0.01" required defaultValue={booking.totalAmount} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier Cost</label>
              <input name="costPrice" type="number" min={0} step="0.01" defaultValue={booking.costPrice} placeholder="0" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <select name="currency" defaultValue={booking.currency} className={inputCls}>
              {["INR","USD","EUR","GBP","AED","SGD","AUD"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Destinations (comma-separated)</label>
            <input name="destinations" defaultValue={booking.destinations.join(", ")} placeholder="Dubai, Maldives" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requests</label>
            <textarea name="specialRequests" defaultValue={booking.specialRequests ?? ""} rows={2} className={`${inputCls} resize-none`} placeholder="Dietary requirements, room preferences..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal Notes</label>
            <textarea name="internalNotes" defaultValue={booking.internalNotes ?? ""} rows={2} className={`${inputCls} resize-none`} placeholder="Internal notes for staff..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShow(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Payment Form ────────────────────────────────────────────────────────

export function AddPaymentForm({
  bookingId,
  currency,
  balanceDue,
}: {
  bookingId: string;
  currency: string;
  balanceDue: number;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: balanceDue > 0 ? String(balanceDue) : "",
    method: "BANK_TRANSFER",
    reference: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      await addPayment({
        bookingId,
        amount,
        currency,
        method: form.method,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded`);
      setShow(false);
      setForm({ amount: "", method: "BANK_TRANSFER", reference: "", notes: "" });
      router.refresh();
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <DollarSign className="w-4 h-4" />
        Record Payment
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-4 mb-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Record Payment</h3>
        <button type="button" onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount ({currency}) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Method *</label>
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputCls}>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CRYPTO">Crypto</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reference / Transaction ID</label>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder="TXN123456"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes"
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <DollarSign className="w-4 h-4" />
          {saving ? "Saving..." : "Record Payment"}
        </button>
        <button type="button" onClick={() => setShow(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Add Passenger Form ───────────────────────────────────────────────────────

export function AddPassengerForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", type: "ADULT",
    dateOfBirth: "", gender: "", nationality: "",
    passportNumber: "", passportExpiry: "",
    seatPreference: "", mealPreference: "", specialNeeds: "",
  });

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast.error("First and last name required"); return; }
    setSaving(true);
    try {
      await addPassenger(bookingId, {
        firstName: form.firstName,
        lastName: form.lastName,
        type: form.type,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        nationality: form.nationality || undefined,
        passportNumber: form.passportNumber || undefined,
        passportExpiry: form.passportExpiry || undefined,
        seatPreference: form.seatPreference || undefined,
        mealPreference: form.mealPreference || undefined,
        specialNeeds: form.specialNeeds || undefined,
      });
      toast.success(`${form.firstName} ${form.lastName} added`);
      setShow(false);
      setForm({ firstName: "", lastName: "", type: "ADULT", dateOfBirth: "", gender: "", nationality: "", passportNumber: "", passportExpiry: "", seatPreference: "", mealPreference: "", specialNeeds: "" });
      router.refresh();
    } catch {
      toast.error("Failed to add passenger");
    } finally {
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Passenger
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add Passenger</h2>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
              <input value={form.firstName} onChange={e => update("firstName", e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
              <input value={form.lastName} onChange={e => update("lastName", e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={e => update("type", e.target.value)} className={inputCls}>
                <option value="ADULT">Adult</option>
                <option value="CHILD">Child</option>
                <option value="INFANT">Infant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
              <select value={form.gender} onChange={e => update("gender", e.target.value)} className={inputCls}>
                <option value="">— Select —</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality</label>
            <input value={form.nationality} onChange={e => update("nationality", e.target.value)} placeholder="e.g. Indian" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passport Number</label>
              <input value={form.passportNumber} onChange={e => update("passportNumber", e.target.value)} placeholder="A1234567" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passport Expiry</label>
              <input type="date" value={form.passportExpiry} onChange={e => update("passportExpiry", e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Seat Preference</label>
              <select value={form.seatPreference} onChange={e => update("seatPreference", e.target.value)} className={inputCls}>
                <option value="">No preference</option>
                <option value="WINDOW">Window</option>
                <option value="AISLE">Aisle</option>
                <option value="MIDDLE">Middle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meal Preference</label>
              <select value={form.mealPreference} onChange={e => update("mealPreference", e.target.value)} className={inputCls}>
                <option value="">Standard</option>
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
                <option value="HALAL">Halal</option>
                <option value="KOSHER">Kosher</option>
                <option value="GLUTEN_FREE">Gluten Free</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Needs / Accessibility</label>
            <input value={form.specialNeeds} onChange={e => update("specialNeeds", e.target.value)} placeholder="Wheelchair, extra legroom..." className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShow(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Adding..." : "Add Passenger"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Remove Passenger Button ──────────────────────────────────────────────────

export function RemovePassengerButton({ passengerId, bookingId, name }: { passengerId: string; bookingId: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove ${name} from this booking?`)) return;
    setLoading(true);
    try {
      await removePassenger(passengerId, bookingId);
      toast.success(`${name} removed`);
      router.refresh();
    } catch {
      toast.error("Failed to remove passenger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
      title="Remove passenger"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

// ── Booking Note Form ────────────────────────────────────────────────────────

export function BookingNoteForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addBookingNote(bookingId, content);
      setContent("");
      toast.success("Note added");
      router.refresh();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Add a note about this booking..."
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {saving ? "Saving..." : "Add Note"}
        </button>
      </div>
    </form>
  );
}

// ── Send Confirmation Email ──────────────────────────────────────────────────

export function SendConfirmationEmailButton({ bookingId, contactEmail }: { bookingId: string; contactEmail: string }) {
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      await resendBookingConfirmation(bookingId);
      toast.success(`Confirmation email sent to ${contactEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
    >
      <Mail className="w-4 h-4" />
      {sending ? "Sending..." : "Send Confirmation"}
    </button>
  );
}
