"use client";
export default function VisaError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-sm text-gray-500">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Try again
      </button>
    </div>
  );
}
