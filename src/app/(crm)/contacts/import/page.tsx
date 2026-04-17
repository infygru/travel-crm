import { ImportWizard } from "@/components/contacts/import-wizard";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";

export default function ImportContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contacts" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Contacts
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-bold text-gray-900">Import Contacts</h1>
        </div>
        <Link
          href="/contacts/import/history"
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <History className="w-4 h-4 text-gray-400" />
          Import History
        </Link>
      </div>
      <ImportWizard />
    </div>
  );
}
