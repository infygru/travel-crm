import { getPublicForm } from "@/lib/actions/leads";
import { Globe } from "lucide-react";
import { PublicFormClient } from "./public-form-client";

interface PublicFormPageProps {
  params: Promise<{ embedToken: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { embedToken } = await params;
  const form = await getPublicForm(embedToken);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-500 text-sm">This form is no longer available.</p>
        </div>
      </div>
    );
  }

  const fields = form.fields as Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
  }>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {form.title ?? "Contact Us"}
          </h1>
          {form.description && (
            <p className="text-gray-500 mt-2 text-sm">{form.description}</p>
          )}
        </div>

        <PublicFormClient
          embedToken={embedToken}
          fields={fields}
          redirectUrl={form.redirectUrl ?? undefined}
        />
      </div>
    </div>
  );
}
