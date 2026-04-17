"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createContact } from "@/lib/actions/contacts";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  leadSource: z.string().optional(),
  leadStatus: z.string().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferredContact: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function NewContactPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      leadStatus: "NEW",
      leadScore: 0,
      preferredContact: "EMAIL",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      const contact = await createContact({
        ...data,
        email: data.email || undefined,
        passportExpiry: data.passportExpiry || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        preferredContact: data.preferredContact || undefined,
      });
      toast.success("Contact created successfully");
      router.push(`/contacts/${contact.id}`);
    } catch {
      toast.error("Failed to create contact. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contacts" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Contact</h1>
        <p className="text-gray-500 mt-1">Add a new contact to your CRM</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
              <input {...register("firstName")} className={inputCls} placeholder="John" />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
              <input {...register("lastName")} className={inputCls} placeholder="Smith" />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input {...register("email")} type="email" className={inputCls} placeholder="john@example.com" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input {...register("phone")} className={inputCls} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile</label>
              <input {...register("mobile")} className={inputCls} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
              <input {...register("jobTitle")} className={inputCls} placeholder="CEO" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <input {...register("department")} className={inputCls} placeholder="Sales" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
              <input {...register("dateOfBirth")} type="date" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Contact</label>
              <select {...register("preferredContact")} className={`${inputCls} bg-white`}>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <input {...register("country")} className={inputCls} placeholder="United States" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input {...register("city")} className={inputCls} placeholder="New York" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input {...register("address")} className={inputCls} placeholder="123 Main St" />
            </div>
          </div>
        </div>

        {/* Lead Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Lead Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead Status</label>
              <select {...register("leadStatus")} className={`${inputCls} bg-white`}>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead Source</label>
              <select {...register("leadSource")} className={`${inputCls} bg-white`}>
                <option value="">Select source...</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="COLD_CALL">Cold Call</option>
                <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                <option value="TRADE_SHOW">Trade Show</option>
                <option value="PARTNER">Partner</option>
                <option value="ADVERTISEMENT">Advertisement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead Score (0-100)</label>
              <input
                {...register("leadScore", { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality</label>
              <input {...register("nationality")} className={inputCls} placeholder="American" />
            </div>
          </div>
        </div>

        {/* Travel Documents */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Travel Documents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passport Number</label>
              <input {...register("passportNumber")} className={inputCls} placeholder="A12345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passport Expiry</label>
              <input {...register("passportExpiry")} type="date" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            {...register("notes")}
            rows={4}
            className={`${inputCls} resize-none`}
            placeholder="Any additional notes about this contact..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/contacts"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Contact
          </button>
        </div>
      </form>
    </div>
  );
}
