import { getDealById, getPipelines } from "@/lib/actions/deals";
import { getCompanySettings } from "@/lib/actions/settings";
import { formatCurrency } from "@/lib/currency";
import { getSequences } from "@/lib/actions/marketing";
import { getQuotes } from "@/lib/actions/quotes";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar, User, Building2, Package, Tag,
  CheckCircle2, ChevronRight, Map, BookOpen, Phone, Mail, MessageSquare, Plus
} from "lucide-react";
import { PRIORITY_COLORS, TASK_STATUS_COLORS, BOOKING_STATUS_COLORS } from "@/lib/constants";
import { DealActions, StageButton, AddNoteForm, AddTaskForm, CreateBookingButton } from "./deal-actions";
import { EnrollSequenceButton } from "@/app/(crm)/contacts/[id]/contact-actions";

interface DealDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
};

export default async function DealDetailPage({ params, searchParams }: DealDetailPageProps) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const [deal, pipelines, sequences, quotesResult, settings] = await Promise.all([
    getDealById(id),
    getPipelines(),
    getSequences(),
    getQuotes({ dealId: id }),
    getCompanySettings(),
  ]);
  if (!deal) notFound();

  const activeSequences = sequences.filter((s) => s.isActive);

  const dealQuotes = quotesResult.quotes;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "quotes", label: `Quotes (${dealQuotes.length})` },
    { id: "tasks", label: `Tasks (${deal.tasks.length})` },
    { id: "itineraries", label: `Itineraries (${deal.itineraries.length})` },
    { id: "bookings", label: `Bookings (${deal.bookings.length})` },
    { id: "notes", label: `Notes (${deal.notes.length})` },
    { id: "activity", label: "Activity" },
  ];

  const pipelineStages = deal.pipeline?.stages ?? [];

  // Workflow step statuses
  const hasContact = !!deal.contact;
  const hasPackage = !!deal.package;
  const hasItinerary = deal.itineraries.length > 0;
  const hasBooking = deal.bookings.length > 0;

  // Determine current active step (first incomplete step)
  const currentStep = !hasContact ? 1 : !hasPackage ? 2 : !hasItinerary ? 3 : !hasBooking ? 4 : 5;

  const steps = [
    {
      num: 1,
      title: "Customer",
      icon: User,
      done: hasContact,
      doneLabel: deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : undefined,
      doneHref: deal.contact ? `/contacts/${deal.contact.id}` : undefined,
      todoLabel: "Link a customer to this deal",
      action: null, // edit deal to add contact
      actionLabel: "Edit Deal",
    },
    {
      num: 2,
      title: "Package",
      icon: Package,
      done: hasPackage,
      doneLabel: deal.package?.name,
      doneHref: deal.package ? `/packages/${deal.package.id}` : undefined,
      todoLabel: "Select a travel package",
      action: "/packages",
      actionLabel: "Browse Packages",
    },
    {
      num: 3,
      title: "Itinerary",
      icon: Map,
      done: hasItinerary,
      doneLabel: `${deal.itineraries.length} itinerary built`,
      doneHref: deal.itineraries[0] ? `/itineraries/${deal.itineraries[0].id}` : undefined,
      todoLabel: "Build a day-by-day itinerary",
      action: `/itineraries/new?dealId=${deal.id}${deal.contact ? `&contactId=${deal.contact.id}` : ""}${deal.package ? `&packageId=${deal.package.id}` : ""}`,
      actionLabel: "Create Itinerary",
    },
    {
      num: 4,
      title: "Booking",
      icon: BookOpen,
      done: hasBooking,
      doneLabel: deal.bookings[0] ? `${deal.bookings[0].status}` : undefined,
      doneHref: deal.bookings[0] ? `/bookings/${deal.bookings[0].id}` : undefined,
      todoLabel: "Confirm the booking",
      action: `/bookings/new?dealId=${deal.id}${deal.contact ? `&contactId=${deal.contact.id}` : ""}`,
      actionLabel: "Create Booking",
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <Link href="/deals" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Deals
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[deal.status] ?? "bg-gray-100 text-gray-700"}`}>
                {deal.status}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[deal.priority]}`}>
                {deal.priority}
              </span>
              {deal.stage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: deal.stage.color }} />
                  {deal.stage.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
            {deal.description && (
              <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-3xl font-bold text-indigo-600">{formatCurrency(deal.value, settings.currency)}</p>
            <p className="text-sm text-gray-500 mt-0.5">{deal.probability}% probability</p>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-6 flex-wrap pt-3 border-t border-gray-100 text-sm text-gray-500">
          {deal.contact && (
            <Link href={`/contacts/${deal.contact.id}`} className="flex items-center gap-1.5 hover:text-indigo-600">
              <User className="w-3.5 h-3.5" />
              {deal.contact.firstName} {deal.contact.lastName}
            </Link>
          )}
          {deal.company && (
            <Link href={`/companies/${deal.company.id}`} className="flex items-center gap-1.5 hover:text-indigo-600">
              <Building2 className="w-3.5 h-3.5" />
              {deal.company.name}
            </Link>
          )}
          {deal.expectedClose && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Closes {format(new Date(deal.expectedClose), "MMM d, yyyy")}
            </span>
          )}
          {deal.owner && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {deal.owner.name}
            </span>
          )}
        </div>

        {/* Pipeline Stage Tracker */}
        {pipelineStages.length > 0 && deal.status === "OPEN" && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Pipeline Stage</p>
            <div className="flex items-center gap-1 flex-wrap">
              {pipelineStages.map((stage, i) => {
                const isActive = stage.id === deal.stageId;
                const isPast = pipelineStages.findIndex(s => s.id === deal.stageId) > i;
                return (
                  <div key={stage.id} className="flex items-center gap-1">
                    <StageButton dealId={deal.id} stage={stage} isActive={isActive} isPast={isPast} />
                    {i < pipelineStages.length - 1 && (
                      <span className="text-gray-200 text-xs">›</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
          <Link
            href={`/quotes?dealId=${deal.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Quote
          </Link>
          {deal.contact && activeSequences.length > 0 && (
            <EnrollSequenceButton contactId={deal.contact.id} sequences={activeSequences} />
          )}
          <DealActions dealId={deal.id} currentStatus={deal.status} deal={{
            title: deal.title,
            value: deal.value,
            currency: deal.currency,
            probability: deal.probability,
            priority: deal.priority,
            description: deal.description ?? "",
            expectedClose: deal.expectedClose ? format(new Date(deal.expectedClose), "yyyy-MM-dd") : "",
            stageId: deal.stageId ?? "",
          }} />
          {deal.contact && (
            <div className="flex items-center gap-2 ml-auto">
              {deal.contact.phone && (
                <a href={`tel:${deal.contact.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
              {deal.contact.email && (
                <a href={`mailto:${deal.contact.email}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              )}
              {deal.contact.phone && (
                <a href={`https://wa.me/${deal.contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4-Step Workflow */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Deal Workflow</h2>
          <span className="text-xs text-gray-400">{Math.min(currentStep - 1, 4)} of 4 steps complete</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.num === currentStep;
            const isFuture = step.num > currentStep;

            return (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className={`absolute top-5 left-[calc(100%-8px)] w-[calc(100%-8px+12px)] h-0.5 z-0 hidden lg:block ${
                    step.done ? "bg-green-200" : "bg-gray-100"
                  }`} style={{ left: "calc(100% + 6px)", width: "calc(100% - 12px)", top: "20px" }} />
                )}
                <div className={`relative z-10 flex flex-col p-4 rounded-xl border-2 transition-all ${
                  step.done
                    ? "border-green-200 bg-green-50"
                    : isActive
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : "border-gray-100 bg-gray-50 opacity-60"
                }`}>
                  {/* Step header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done ? "bg-green-500" : isActive ? "bg-indigo-600" : "bg-gray-300"
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-white">{step.num}</span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${
                      step.done ? "text-green-700" : isActive ? "text-indigo-700" : "text-gray-400"
                    }`}>
                      {step.title}
                    </span>
                  </div>

                  {/* Step content */}
                  {step.done && step.doneLabel ? (
                    <div className="mt-1">
                      {step.doneHref ? (
                        <Link href={step.doneHref} className="text-sm font-medium text-green-800 hover:text-green-900 hover:underline line-clamp-2">
                          {step.doneLabel}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-green-800 line-clamp-2">{step.doneLabel}</p>
                      )}
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    </div>
                  ) : isActive ? (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500 mb-2.5">{step.todoLabel}</p>
                      {step.action && (
                        <Link
                          href={step.action}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> {step.actionLabel}
                        </Link>
                      )}
                      {!step.action && (
                        <p className="text-xs text-indigo-600 font-medium">Edit deal to link</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">{step.todoLabel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion banner */}
        {currentStep > 4 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">All steps complete!</p>
              <p className="text-xs text-green-600">Customer booked. Track payment and departure tasks in the tabs below.</p>
            </div>
            {deal.bookings[0] && (
              <Link href={`/bookings/${deal.bookings[0].id}`} className="ml-auto flex-shrink-0 text-xs font-medium text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100">
                View Booking →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/deals/${id}?tab=${t.id}`}
              className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="p-6">
          {/* Overview */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Deal Details</h3>
                <div className="space-y-3">
                  {[
                    { label: "Value", value: formatCurrency(deal.value, settings.currency) },
                    { label: "Probability", value: `${deal.probability}%` },
                    { label: "Priority", value: deal.priority },
                    { label: "Status", value: deal.status },
                    { label: "Pipeline", value: deal.pipeline?.name ?? "—" },
                    { label: "Stage", value: deal.stage?.name ?? "—" },
                    { label: "Created", value: format(new Date(deal.createdAt), "MMM d, yyyy") },
                    { label: "Updated", value: format(new Date(deal.updatedAt), "MMM d, yyyy") },
                    ...(deal.expectedClose ? [{ label: "Expected Close", value: format(new Date(deal.expectedClose), "MMM d, yyyy") }] : []),
                    ...(deal.actualClose ? [{ label: "Actual Close", value: format(new Date(deal.actualClose), "MMM d, yyyy") }] : []),
                    ...(deal.lostReason ? [{ label: "Lost Reason", value: deal.lostReason }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {deal.package && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Linked Package</h3>
                    <Link href={`/packages/${deal.package.id}`} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Package className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{deal.package.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(deal.package.basePrice, settings.currency)} base price</p>
                      </div>
                    </Link>
                  </div>
                )}
                {deal.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {deal.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                          <Tag className="w-3 h-3" /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {deal.contact && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer</h3>
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                        {deal.contact.firstName[0]}{deal.contact.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/contacts/${deal.contact.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                          {deal.contact.firstName} {deal.contact.lastName}
                        </Link>
                        {deal.contact.email && <p className="text-xs text-gray-400 truncate">{deal.contact.email}</p>}
                        {deal.contact.phone && <p className="text-xs text-gray-400">{deal.contact.phone}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {deal.contact.phone && (
                          <a href={`tel:${deal.contact.phone}`} className="text-xs text-indigo-600 hover:underline">Call</a>
                        )}
                        {deal.contact.email && (
                          <a href={`mailto:${deal.contact.email}`} className="text-xs text-indigo-600 hover:underline">Email</a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quotes */}
          {tab === "quotes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Quotes / Proposals</h3>
                <Link
                  href={`/quotes?dealId=${deal.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View all quotes →
                </Link>
              </div>
              {dealQuotes.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">No quotes yet for this deal.</p>
              ) : (
                <div className="space-y-2">
                  {dealQuotes.map((q) => (
                    <Link
                      key={q.id}
                      href={`/quotes/${q.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{q.title}</p>
                        <p className="text-xs text-gray-400">{q.quoteNumber}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(q.totalAmount, settings.currency, { maximumFractionDigits: 0 })}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          q.status === "ACCEPTED" ? "bg-green-100 text-green-700"
                          : q.status === "DECLINED" ? "bg-red-100 text-red-700"
                          : q.status === "SENT" ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                        }`}>
                          {q.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          {tab === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
                <AddTaskForm dealId={deal.id} contactId={deal.contact?.id} />
              </div>
              {deal.tasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No tasks yet. Add one to track follow-ups and actions.</p>
              ) : (
                deal.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">{task.type.replace(/_/g, " ")}</span>
                        {task.dueDate && <span className="text-xs text-gray-400">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>}
                        {task.assignee && <span className="text-xs text-gray-400">{task.assignee.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_COLORS[task.status]}`}>{task.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Itineraries */}
          {tab === "itineraries" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Itineraries</h3>
                <Link
                  href={`/itineraries/new?dealId=${deal.id}${deal.contact ? `&contactId=${deal.contact.id}` : ""}${deal.package ? `&packageId=${deal.package.id}` : ""}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" /> New Itinerary
                </Link>
              </div>
              {deal.itineraries.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <Map className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 mb-1">No itineraries yet</p>
                  <p className="text-xs text-gray-400 mb-4">Build a day-by-day travel plan for your customer</p>
                  <Link
                    href={`/itineraries/new?dealId=${deal.id}${deal.contact ? `&contactId=${deal.contact.id}` : ""}${deal.package ? `&packageId=${deal.package.id}` : ""}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" /> Create Itinerary for {deal.contact?.firstName ?? "this deal"}
                  </Link>
                </div>
              ) : (
                deal.itineraries.map((itin) => (
                  <Link key={itin.id} href={`/itineraries/${itin.id}`} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Map className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600">{itin.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(itin.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-600">{itin.status}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Bookings */}
          {tab === "bookings" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Bookings</h3>
                <CreateBookingButton dealId={deal.id} contactId={deal.contact?.id} currency={deal.currency} />
              </div>
              {deal.bookings.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 mb-1">No bookings yet</p>
                  <p className="text-xs text-gray-400 mb-4">Create a booking to confirm the trip with the customer</p>
                  <CreateBookingButton dealId={deal.id} contactId={deal.contact?.id} currency={deal.currency} />
                </div>
              ) : (
                deal.bookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-indigo-600">{booking.bookingRef.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>{booking.status}</span>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount, settings.currency)}</p>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Notes */}
          {tab === "notes" && (
            <div className="space-y-4">
              <AddNoteForm dealId={deal.id} />
              {deal.notes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notes yet</p>
              ) : (
                deal.notes.map((note) => (
                  <div key={note.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {note.author?.name?.[0] ?? "?"}
                      </div>
                      <p className="text-xs font-medium text-gray-700">{note.author?.name}</p>
                      <p className="text-xs text-gray-400 ml-auto">{format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Activity */}
          {tab === "activity" && (
            <div className="space-y-3">
              {deal.activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
              ) : (
                deal.activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-gray-50">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                      {activity.user?.name?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{activity.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(activity.createdAt), "MMM d, yyyy · h:mm a")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
