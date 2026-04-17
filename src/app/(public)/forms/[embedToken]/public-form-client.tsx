"use client";

import { useState } from "react";
import { submitWebLeadForm } from "@/lib/actions/leads";
import { CheckCircle2, Send } from "lucide-react";

interface PublicFormClientProps {
  embedToken: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  redirectUrl?: string;
}

export function PublicFormClient({ embedToken, fields, redirectUrl }: PublicFormClientProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await submitWebLeadForm(embedToken, values);
      setSubmitted(true);
      if (redirectUrl) {
        setTimeout(() => { window.location.href = redirectUrl; }, 2000);
      }
    } catch (err) {
      setError("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-500 text-sm">
          Your enquiry has been received. We'll be in touch with you shortly.
        </p>
        {redirectUrl && (
          <p className="text-xs text-gray-400 mt-4">Redirecting you in a moment...</p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 space-y-5"
    >
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              value={values[field.key] ?? ""}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              required={field.required}
              rows={4}
              placeholder={`Your ${field.label.toLowerCase()}...`}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow"
            />
          ) : (
            <input
              type={field.type}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              required={field.required}
              placeholder={
                field.type === "email" ? "you@example.com"
                : field.type === "tel" ? "+1 234 567 8900"
                : field.label
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          )}
        </div>
      ))}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Sending..." : "Send Enquiry"}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your information is kept private and secure.
      </p>
    </form>
  );
}
