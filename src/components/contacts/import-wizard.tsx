"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { bulkImportContacts } from "@/lib/actions/imports";
import { CRM_CONTACT_FIELDS, type ImportResult, type ImportRow, type FieldMapping } from "@/lib/import-fields";
import { toast } from "sonner";

type Step = "upload" | "mapping" | "results";

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsed = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });

        if (parsed.length === 0) {
          toast.error("The file appears to be empty");
          return;
        }

        const cols = Object.keys(parsed[0]);
        setHeaders(cols);
        setRows(parsed);
        setPreviewRows(parsed.slice(0, 5));
        setFileName(file.name);

        // Auto-map based on fuzzy header matching
        const autoMap: FieldMapping = {};
        for (const col of cols) {
          const normalized = col.toLowerCase().replace(/[\s_-]/g, "");
          for (const field of CRM_CONTACT_FIELDS) {
            const fieldNorm = field.key.toLowerCase();
            const labelNorm = field.label.toLowerCase().replace(/[\s_\-()]/g, "");
            if (normalized === fieldNorm || normalized === labelNorm) {
              autoMap[col] = field.key;
              break;
            }
          }
        }
        setFieldMapping(autoMap);
        setStep("mapping");
      } catch {
        toast.error("Could not parse file. Please use .xlsx or .csv format.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  async function handleImport() {
    setLoading(true);
    try {
      const res = await bulkImportContacts(rows, fieldMapping, fileName);
      setResult(res);
      setStep("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  const mappedRequired = CRM_CONTACT_FIELDS.filter((f) => "required" in f && f.required).every(
    (f) => Object.values(fieldMapping).includes(f.key)
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {(["upload", "mapping", "results"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s ? "bg-indigo-600 text-white" : i < ["upload", "mapping", "results"].indexOf(step) ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {i < ["upload", "mapping", "results"].indexOf(step) ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s ? "text-gray-900" : "text-gray-400"}`}>
              {s === "upload" ? "Upload File" : s === "mapping" ? "Map Fields" : "Results"}
            </span>
            {i < 2 && <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-base font-semibold text-gray-700 mb-1">Drop your file here or click to browse</p>
          <p className="text-sm text-gray-400 mb-4">Supports .xlsx, .xls, and .csv files</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
            <Upload className="w-4 h-4" /> Choose File
          </div>
          <div className="mt-6 text-left max-w-sm mx-auto bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Required columns:</p>
            <p className="text-xs text-gray-500">First Name, Last Name</p>
            <p className="text-xs font-semibold text-gray-600 mt-2 mb-1">Optional columns:</p>
            <p className="text-xs text-gray-500">Email, Phone, Mobile, Country, City, Nationality, Passport Number, Passport Expiry, Date of Birth, Lead Source, Lead Status, Tags, Notes</p>
          </div>
        </div>
      )}

      {/* Step 2: Field Mapping */}
      {step === "mapping" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Map Spreadsheet Columns to CRM Fields</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {rows.length} rows detected · {fileName}
            </p>
          </div>

          <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
            {headers.map((col) => (
              <div key={col} className="flex items-center gap-4">
                <div className="w-48 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700 truncate" title={col}>{col}</p>
                  {previewRows[0]?.[col] !== undefined && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{String(previewRows[0][col])}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <select
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={fieldMapping[col] ?? ""}
                  onChange={(e) => setFieldMapping((prev) => ({ ...prev, [col]: e.target.value }))}
                >
                  <option value="">— Skip this column —</option>
                  {CRM_CONTACT_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}{"required" in f && f.required ? " *" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preview (first 5 rows)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                        {h}
                        {fieldMapping[h] && (
                          <span className="ml-1 text-indigo-500">→ {fieldMapping[h]}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-[150px] truncate">{String(row[h] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <button
              onClick={() => setStep("upload")}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {!mappedRequired && (
              <p className="text-sm text-red-500">Please map required fields: First Name, Last Name</p>
            )}
            <button
              onClick={handleImport}
              disabled={!mappedRequired || loading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Import {rows.length} Contacts
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === "results" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{result.totalRows}</p>
              <p className="text-xs text-gray-500 mt-1">Total Rows</p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{result.successRows}</p>
              <p className="text-xs text-gray-500 mt-1">Imported</p>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{result.duplicates}</p>
              <p className="text-xs text-gray-500 mt-1">Duplicates Skipped</p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{result.errorRows}</p>
              <p className="text-xs text-gray-500 mt-1">Errors</p>
            </div>
          </div>

          {result.successRows > 0 && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">
                Successfully imported {result.successRows} contact{result.successRows !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-700">{result.errors.length} issue{result.errors.length !== 1 ? "s" : ""} found</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-gray-600">Row {err.row} · {err.field}:</span>
                      <span className="text-xs text-gray-500 ml-1">{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep("upload"); setRows([]); setHeaders([]); setFieldMapping({}); setResult(null); }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Import Another File
            </button>
            <button
              onClick={() => router.push("/contacts")}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              View Contacts →
            </button>
            <button
              onClick={() => router.push("/contacts/import/history")}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              View Import History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
