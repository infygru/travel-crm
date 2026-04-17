"use client";

export function PrintButton() {
  return (
    <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-full shadow-lg hover:shadow-xl hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm font-semibold"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print / Save as PDF
      </button>
    </div>
  );
}
