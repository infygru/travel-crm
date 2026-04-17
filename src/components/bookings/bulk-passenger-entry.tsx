"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPassengersBulk } from "@/lib/actions/bookings";
import { toast } from "sonner";
import { Users, Plus, Trash2, Upload, Loader2, ChevronDown, ChevronUp } from "lucide-react";

type PassengerRow = {
  firstName: string;
  lastName: string;
  type: "ADULT" | "CHILD" | "INFANT";
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  seatPreference: string;
  mealPreference: string;
  specialNeeds: string;
  email: string;
  phone: string;
  individualCost: string;
};

function emptyRow(): PassengerRow {
  return {
    firstName: "", lastName: "", type: "ADULT", nationality: "", passportNumber: "",
    passportExpiry: "", dateOfBirth: "", seatPreference: "", mealPreference: "",
    specialNeeds: "", email: "", phone: "", individualCost: "",
  };
}

const inputCls = "w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white";

export function BulkPassengerEntry({ bookingId, currency }: { bookingId: string; currency: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PassengerRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  function updateRow(i: number, field: keyof PassengerRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function parsePasteData(text: string) {
    // Support tab-separated or comma-separated
    // Expected columns: First Name, Last Name, Type, DOB, Passport, Nationality, Seat, Meal, Cost
    const lines = text.trim().split("\n").filter(Boolean);
    const parsed: PassengerRow[] = [];
    for (const line of lines) {
      const sep = line.includes("\t") ? "\t" : ",";
      const cols = line.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
      if (cols.length < 2) continue;
      parsed.push({
        firstName: cols[0] ?? "",
        lastName: cols[1] ?? "",
        type: (["ADULT", "CHILD", "INFANT"].includes((cols[2] ?? "").toUpperCase()) ? (cols[2] ?? "ADULT").toUpperCase() : "ADULT") as "ADULT" | "CHILD" | "INFANT",
        dateOfBirth: cols[3] ?? "",
        passportNumber: cols[4] ?? "",
        nationality: cols[5] ?? "",
        seatPreference: cols[6] ?? "",
        mealPreference: cols[7] ?? "",
        individualCost: cols[8] ?? "",
        passportExpiry: "",
        specialNeeds: "",
        email: "",
        phone: "",
      });
    }
    return parsed;
  }

  function applyPaste() {
    const parsed = parsePasteData(pasteText);
    if (parsed.length === 0) {
      toast.error("Could not parse data. Use tab-separated or CSV format.");
      return;
    }
    setRows(parsed);
    setPasteMode(false);
    setPasteText("");
    toast.success(`Loaded ${parsed.length} passengers from paste`);
  }

  async function handleSubmit() {
    const valid = rows.filter((r) => r.firstName.trim() && r.lastName.trim());
    if (valid.length === 0) {
      toast.error("At least one passenger requires first and last name");
      return;
    }
    setLoading(true);
    try {
      const result = await addPassengersBulk(
        bookingId,
        valid.map((r) => ({
          firstName: r.firstName,
          lastName: r.lastName,
          type: r.type,
          nationality: r.nationality || undefined,
          passportNumber: r.passportNumber || undefined,
          passportExpiry: r.passportExpiry || undefined,
          dateOfBirth: r.dateOfBirth || undefined,
          seatPreference: r.seatPreference || undefined,
          mealPreference: r.mealPreference || undefined,
          specialNeeds: r.specialNeeds || undefined,
          email: r.email || undefined,
          phone: r.phone || undefined,
          individualCost: r.individualCost ? parseFloat(r.individualCost) : 0,
        }))
      );
      toast.success(`${result.count} passenger${result.count !== 1 ? "s" : ""} added`);
      setRows([emptyRow()]);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add passengers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">Add Multiple Passengers</span>
          <span className="text-xs text-indigo-500">Paste from Excel or fill in the table</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* Toggle paste mode */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPasteMode(!pasteMode)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {pasteMode ? "Use Table Instead" : "Paste from Excel"}
            </button>
            {!pasteMode && (
              <span className="text-xs text-gray-400">
                Columns: First Name, Last Name, Type (Adult/Child/Infant), DOB, Passport, Nationality, Seat, Meal, Cost
              </span>
            )}
          </div>

          {pasteMode ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Paste tab-separated or CSV data from Excel. First row is data (no header row).</p>
              <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-2 rounded">
                John	Smith	Adult	1985-03-15	AB123456	Indian	Window	Veg	15000
              </p>
              <textarea
                className="w-full h-32 px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Paste data here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <button
                onClick={applyPaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Load Data
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">First Name *</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Last Name *</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Type</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Nationality</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Passport No.</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Passport Exp.</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">DOB</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Seat</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Meal</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Cost ({currency})</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="px-1 py-1"><input className={inputCls} value={row.firstName} onChange={(e) => updateRow(i, "firstName", e.target.value)} placeholder="First Name" /></td>
                      <td className="px-1 py-1"><input className={inputCls} value={row.lastName} onChange={(e) => updateRow(i, "lastName", e.target.value)} placeholder="Last Name" /></td>
                      <td className="px-1 py-1">
                        <select className={inputCls} value={row.type} onChange={(e) => updateRow(i, "type", e.target.value as "ADULT" | "CHILD" | "INFANT")}>
                          <option value="ADULT">Adult</option>
                          <option value="CHILD">Child</option>
                          <option value="INFANT">Infant</option>
                        </select>
                      </td>
                      <td className="px-1 py-1"><input className={inputCls} value={row.nationality} onChange={(e) => updateRow(i, "nationality", e.target.value)} placeholder="Nationality" /></td>
                      <td className="px-1 py-1"><input className={inputCls} value={row.passportNumber} onChange={(e) => updateRow(i, "passportNumber", e.target.value)} placeholder="Passport No." /></td>
                      <td className="px-1 py-1"><input type="date" className={inputCls} value={row.passportExpiry} onChange={(e) => updateRow(i, "passportExpiry", e.target.value)} /></td>
                      <td className="px-1 py-1"><input type="date" className={inputCls} value={row.dateOfBirth} onChange={(e) => updateRow(i, "dateOfBirth", e.target.value)} /></td>
                      <td className="px-1 py-1"><input className={inputCls} value={row.seatPreference} onChange={(e) => updateRow(i, "seatPreference", e.target.value)} placeholder="Window/Aisle" /></td>
                      <td className="px-1 py-1"><input className={inputCls} value={row.mealPreference} onChange={(e) => updateRow(i, "mealPreference", e.target.value)} placeholder="Veg/Non-Veg" /></td>
                      <td className="px-1 py-1"><input type="number" className={inputCls} value={row.individualCost} onChange={(e) => updateRow(i, "individualCost", e.target.value)} placeholder="0" /></td>
                      <td className="px-1 py-1">
                        <button onClick={() => removeRow(i)} className="p-1 text-gray-300 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addRow}
                className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">{rows.filter((r) => r.firstName && r.lastName).length} valid passengers ready</p>
            <button
              onClick={handleSubmit}
              disabled={loading || rows.filter((r) => r.firstName && r.lastName).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Save All Passengers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
