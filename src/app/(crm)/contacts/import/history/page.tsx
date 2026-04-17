import { getImportLogs } from "@/lib/actions/imports";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, Loader2, FileSpreadsheet } from "lucide-react";

export default async function ImportHistoryPage() {
  const { logs, total } = await getImportLogs({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contacts/import" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Import
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">Import History</h1>
        <span className="text-sm text-gray-400">{total} imports</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-14">
            <FileSpreadsheet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No imports yet</p>
            <Link href="/contacts/import" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
              Start Import
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">File</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Rows</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Imported</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Duplicates</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Errors</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">By</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => {
                const errors = log.errors as Array<{ row: number; field: string; message: string }> | null ?? [];
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">{log.fileName}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">{log.fileType}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {log.status === "COMPLETED" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : log.status === "FAILED" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{log.totalRows}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-green-600">{log.successRows}</td>
                    <td className="px-5 py-3.5 text-sm text-amber-500">{log.duplicates}</td>
                    <td className="px-5 py-3.5">
                      {log.errorRows > 0 ? (
                        <details>
                          <summary className="text-sm text-red-500 cursor-pointer">{log.errorRows} errors</summary>
                          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {errors.map((e, i) => (
                              <p key={i} className="text-xs text-gray-500">Row {e.row} · {e.field}: {e.message}</p>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{log.createdBy?.name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{format(new Date(log.createdAt), "MMM d, yyyy · HH:mm")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
