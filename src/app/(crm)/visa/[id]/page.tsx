import { getVisaApplicationById, getAgentsForVisa } from "@/lib/actions/visa";
import { VISA_STAGE_COLORS, VISA_TYPE_LABELS, VISA_STAGE_ORDER, PRIORITY_COLORS } from "@/lib/constants";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ChevronRight, ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { VisaDetailActions } from "./visa-actions";

export const metadata = { title: "Visa Application" };

const STAGE_LABELS: Record<string, string> = {
  INITIATED: "Initiated",
  DOCUMENTS_PENDING: "Documents Pending",
  DOCUMENTS_RECEIVED: "Documents Received",
  SUBMITTED: "Submitted to Embassy",
  PROCESSING: "Under Processing",
  APPOINTMENT_BOOKED: "Appointment Booked",
  APPROVED: "Visa Approved",
  REJECTED: "Visa Rejected",
  CANCELLED: "Cancelled",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  RECEIVED: "bg-blue-100 text-blue-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function VisaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const visa = await getVisaApplicationById(id);
  if (!visa) notFound();

  const agents = await getAgentsForVisa();

  const pendingDocs = visa.documents.filter((d) => d.status === "PENDING").length;
  const receivedDocs = visa.documents.filter((d) => d.status === "RECEIVED" || d.status === "VERIFIED").length;
  const totalDocs = visa.documents.length;
  const docPct = totalDocs > 0 ? Math.round((receivedDocs / totalDocs) * 100) : 0;

  const stageIndex = VISA_STAGE_ORDER.indexOf(visa.stage);
  const isTerminal = visa.stage === "APPROVED" || visa.stage === "REJECTED" || visa.stage === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/visa" className="hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Visa Tracker
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">
          {visa.contact.firstName} {visa.contact.lastName} — {VISA_TYPE_LABELS[visa.visaType] ?? visa.visaType}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {VISA_TYPE_LABELS[visa.visaType] ?? visa.visaType} Visa
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${VISA_STAGE_COLORS[visa.stage] ?? "bg-gray-100 text-gray-700"}`}>
              {STAGE_LABELS[visa.stage] ?? visa.stage}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[visa.priority]}`}>
              {visa.priority}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {visa.destinationCountry}
            {visa.embassyCenter ? ` · ${visa.embassyCenter}` : ""}
            {" · "}Ref: <span className="font-mono">{visa.applicationRef.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>
        <VisaDetailActions visa={visa} agents={agents} />
      </div>

      {/* Stage pipeline */}
      {!isTerminal && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Application Pipeline</p>
          <div className="flex items-center overflow-x-auto gap-0">
            {VISA_STAGE_ORDER.map((stage, idx) => {
              const isCompleted = stageIndex > idx;
              const isCurrent = stageIndex === idx;
              const isNext = stageIndex === idx - 1;
              return (
                <div key={stage} className="flex items-center min-w-0">
                  <div className={`flex flex-col items-center min-w-[80px] ${isNext ? "opacity-100" : isCompleted || isCurrent ? "opacity-100" : "opacity-40"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? "bg-green-500" :
                      isCurrent ? "bg-indigo-600" :
                      "bg-gray-200"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className={`text-[10px] text-center mt-1 leading-tight ${isCurrent ? "text-indigo-600 font-semibold" : isCompleted ? "text-green-600" : "text-gray-400"}`}>
                      {STAGE_LABELS[stage]}
                    </p>
                  </div>
                  {idx < VISA_STAGE_ORDER.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${isCompleted ? "bg-green-400" : "bg-gray-200"}`} style={{ minWidth: 12 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Checklist */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Document Checklist</h2>
                <p className="text-xs text-gray-500 mt-0.5">{receivedDocs} of {totalDocs} received · {pendingDocs} pending</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${docPct === 100 ? "bg-green-500" : docPct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${docPct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">{docPct}%</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {visa.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    doc.status === "VERIFIED" ? "bg-green-100" :
                    doc.status === "RECEIVED" ? "bg-blue-100" :
                    doc.status === "REJECTED" ? "bg-red-100" :
                    "bg-gray-100"
                  }`}>
                    {doc.status === "VERIFIED" || doc.status === "RECEIVED" ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${doc.status === "VERIFIED" ? "text-green-500" : "text-blue-500"}`} />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${doc.status === "VERIFIED" ? "text-gray-500 line-through" : "text-gray-800"}`}>
                      {doc.name}
                    </p>
                    {doc.notes && <p className="text-xs text-gray-400">{doc.notes}</p>}
                    {doc.receivedAt && (
                      <p className="text-xs text-gray-400">Received {format(new Date(doc.receivedAt), "dd MMM yyyy")}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOC_STATUS_COLORS[doc.status]}`}>
                    {doc.status}
                  </span>
                  <VisaDetailActions.DocStatusUpdate docId={doc.id} currentStatus={doc.status} visaId={id} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {visa.notes && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{visa.notes}</p>
            </div>
          )}

          {visa.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-red-800 mb-2">Rejection Reason</h2>
              <p className="text-sm text-red-700">{visa.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Applicant */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Applicant</h2>
            <Link href={`/contacts/${visa.contact.id}`} className="flex items-center gap-3 group mb-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                {visa.contact.firstName[0]}{visa.contact.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600">
                  {visa.contact.firstName} {visa.contact.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{visa.contact.email}</p>
              </div>
            </Link>
            <table className="w-full text-xs">
              <tbody>
                {visa.contact.phone && (
                  <tr><td className="text-gray-500 py-1 w-1/3">Phone</td><td className="text-gray-800">{visa.contact.phone}</td></tr>
                )}
                {visa.contact.nationality && (
                  <tr><td className="text-gray-500 py-1">Nationality</td><td className="text-gray-800">{visa.contact.nationality}</td></tr>
                )}
                {visa.contact.passportNumber && (
                  <tr><td className="text-gray-500 py-1">Passport</td><td className="font-mono text-gray-800">{visa.contact.passportNumber}</td></tr>
                )}
                {visa.contact.passportExpiry && (
                  <tr>
                    <td className="text-gray-500 py-1">Expiry</td>
                    <td className={`font-medium ${new Date(visa.contact.passportExpiry) < new Date() ? "text-red-600" : "text-gray-800"}`}>
                      {format(new Date(visa.contact.passportExpiry), "dd MMM yyyy")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Key Dates */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Dates</h2>
            <table className="w-full text-xs">
              <tbody>
                <tr><td className="text-gray-500 py-1.5 w-1/2">Application Started</td><td className="text-gray-800 font-medium">{format(new Date(visa.applicationDate), "dd MMM yyyy")}</td></tr>
                {visa.travelDate && <tr><td className="text-gray-500 py-1.5">Travel Date</td><td className="text-gray-800 font-medium">{format(new Date(visa.travelDate), "dd MMM yyyy")}</td></tr>}
                {visa.submittedAt && <tr><td className="text-gray-500 py-1.5">Submitted</td><td className="text-gray-800 font-medium">{format(new Date(visa.submittedAt), "dd MMM yyyy")}</td></tr>}
                {visa.appointmentDate && (
                  <tr>
                    <td className="text-gray-500 py-1.5">Appointment</td>
                    <td className="text-indigo-600 font-semibold">
                      {format(new Date(visa.appointmentDate), "dd MMM yyyy")}
                      {visa.appointmentTime ? ` · ${visa.appointmentTime}` : ""}
                    </td>
                  </tr>
                )}
                {visa.decisionDate && <tr><td className="text-gray-500 py-1.5">Decision</td><td className="text-gray-800 font-medium">{format(new Date(visa.decisionDate), "dd MMM yyyy")}</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Booking link */}
          {visa.booking && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Linked Booking</h2>
              <Link href={`/bookings/${visa.booking.id}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                {visa.booking.bookingRef.slice(0, 8).toUpperCase()}
              </Link>
              {visa.booking.startDate && (
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(visa.booking.startDate), "dd MMM")}–{format(new Date(visa.booking.endDate), "dd MMM yyyy")}
                </p>
              )}
              {visa.booking.destinations.length > 0 && (
                <p className="text-xs text-gray-400">{visa.booking.destinations.join(", ")}</p>
              )}
            </div>
          )}

          {/* Agent */}
          {visa.agent && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assigned Agent</h2>
              <p className="text-sm font-medium text-gray-800">{visa.agent.name}</p>
              <p className="text-xs text-gray-400">{visa.agent.email}</p>
            </div>
          )}

          {/* Tracking */}
          {visa.trackingNumber && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tracking Number</h2>
              <p className="font-mono text-sm text-gray-800">{visa.trackingNumber}</p>
            </div>
          )}

          {/* Reminder history */}
          {visa.reminders.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Alert History</h2>
              <div className="space-y-2">
                {visa.reminders.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">{format(new Date(r.sentAt), "dd MMM yyyy HH:mm")}</span>
                    <span className="text-gray-700 capitalize">{r.type.replace(/_/g, " ")}</span>
                    <span className="text-gray-400">via {r.channel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
