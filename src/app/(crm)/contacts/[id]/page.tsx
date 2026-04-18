import { getContactById, getAgents } from "@/lib/actions/contacts";
import { getSequences, getContactEnrollments } from "@/lib/actions/marketing";
import { getQuotes } from "@/lib/actions/quotes";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Star,
  Globe,
  CreditCard,
  Calendar,
  Briefcase,
  Building2,
  Tag,
  GitBranch,
} from "lucide-react";
import { LEAD_STATUS_COLORS, BOOKING_STATUS_COLORS, TASK_STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import {
  ContactActions,
  AddNoteForm,
  QuickTaskForm,
  LeadStatusButtons,
  CreateDealButton,
  CreateBookingButton,
  EnrollSequenceButton,
} from "./contact-actions";

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ContactDetailPage({ params, searchParams }: ContactDetailPageProps) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const [contact, agents, sequences, enrollments, quotesResult] = await Promise.all([
    getContactById(id),
    getAgents(),
    getSequences(),
    getContactEnrollments(id),
    getQuotes({ contactId: id }),
  ]);
  if (!contact) notFound();

  const activeSequences = sequences.filter((s) => s.isActive);
  const contactQuotes = quotesResult.quotes;

  const fullName = `${contact.firstName} ${contact.lastName}`;
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "deals", label: `Deals (${contact.deals.length})` },
    { id: "quotes", label: `Quotes (${contactQuotes.length})` },
    { id: "bookings", label: `Bookings (${contact.bookings.length})` },
    { id: "tasks", label: `Tasks (${contact.tasks.length})` },
    { id: "sequences", label: `Sequences (${enrollments.length})` },
    { id: "activity", label: "Activity" },
    { id: "notes", label: `Notes (${contact.noteRels.length})` },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back */}
      <Link
        href="/contacts"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contacts
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-xl bg-white border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-indigo-600">
                {initials}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                <p className="text-sm text-gray-500">{contact.jobTitle ?? "No title"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1 flex-wrap">
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-700">{contact.leadScore}</span>
                <span className="text-xs text-amber-600">score</span>
              </div>
              <EnrollSequenceButton contactId={id} sequences={activeSequences} />
              <CreateDealButton contactId={id} contactName={fullName} />
              <CreateBookingButton contactId={id} />
              <ContactActions
                contactId={id}
                contact={{
                  firstName: contact.firstName,
                  lastName: contact.lastName,
                  email: contact.email,
                  phone: contact.phone,
                  mobile: contact.mobile,
                  jobTitle: contact.jobTitle,
                  department: contact.department,
                  country: contact.country,
                  city: contact.city,
                  address: contact.address,
                  leadSource: contact.leadSource,
                  leadStatus: contact.leadStatus,
                  leadScore: contact.leadScore,
                  tags: contact.tags,
                  nationality: contact.nationality,
                  passportNumber: contact.passportNumber,
                  passportExpiry: contact.passportExpiry,
                  dateOfBirth: contact.dateOfBirth,
                  preferredContact: contact.preferredContact,
                  notes: contact.notes,
                  companyId: contact.companyId,
                  ownerId: contact.ownerId,
                }}
                agents={agents}
              />
            </div>
          </div>

          {/* Lead status pipeline */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-2">Lead Status</p>
            <LeadStatusButtons contactId={id} currentStatus={contact.leadStatus} />
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap gap-4">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {contact.phone}
              </a>
            )}
            {(contact.city || contact.country) && (
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                {[contact.city, contact.country].filter(Boolean).join(", ")}
              </span>
            )}
            {contact.company && (
              <Link href={`/companies/${contact.company.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                <Building2 className="w-4 h-4 text-gray-400" />
                {contact.company.name}
              </Link>
            )}
            {contact.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                {contact.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Spent", value: `₹${contact.totalSpent.toLocaleString("en-IN")}` },
          { label: "Loyalty Points", value: contact.loyaltyPoints.toLocaleString() },
          { label: "Bookings", value: contact.bookings.length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/contacts/${id}?tab=${t.id}`}
                className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  {[
                    { label: "Full Name", value: fullName, icon: null },
                    { label: "Email", value: contact.email, icon: Mail },
                    { label: "Phone", value: contact.phone, icon: Phone },
                    { label: "Mobile", value: contact.mobile, icon: Phone },
                    { label: "Job Title", value: contact.jobTitle, icon: Briefcase },
                    { label: "Department", value: contact.department, icon: Building2 },
                    { label: "Nationality", value: contact.nationality, icon: Globe },
                    { label: "Date of Birth", value: contact.dateOfBirth ? format(new Date(contact.dateOfBirth), "MMM d, yyyy") : null, icon: Calendar },
                    { label: "Preferred Contact", value: contact.preferredContact ?? null, icon: null },
                    { label: "Lead Source", value: contact.leadSource?.replace(/_/g, " "), icon: null },
                    { label: "Owner", value: contact.owner?.name ?? null, icon: null },
                  ].map(({ label, value, icon: Icon }) => (
                    value ? (
                      <div key={label} className="flex items-start gap-3">
                        {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                        {!Icon && <div className="w-4" />}
                        <div>
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-sm text-gray-700">{value}</p>
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>

              {/* Travel Preferences & Passport */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Passport Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {[
                      { label: "Passport Number", value: contact.passportNumber, icon: CreditCard },
                      { label: "Expiry Date", value: contact.passportExpiry ? format(new Date(contact.passportExpiry), "MMM d, yyyy") : null, icon: Calendar },
                      { label: "Nationality", value: contact.nationality, icon: Globe },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-sm text-gray-700">{value ?? "Not provided"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {contact.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">{contact.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "deals" && (
            <div className="space-y-3">
              {contact.deals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-3">No deals yet for this contact</p>
                  <CreateDealButton contactId={id} contactName={fullName} />
                </div>
              ) : (
                contact.deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors">
                    <div>
                      <Link href={`/deals/${deal.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                        {deal.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{deal.stage?.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-900">₹{deal.value.toLocaleString("en-IN")}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${deal.status === "WON" ? "bg-green-100 text-green-700" : deal.status === "LOST" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {deal.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "quotes" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Quotes & Proposals</p>
                <Link
                  href={`/quotes?contactId=${contact.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View all →
                </Link>
              </div>
              {contactQuotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">No quotes yet</div>
              ) : (
                contactQuotes.map((q) => (
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
                      <span className="text-sm font-bold text-gray-900">
                        ₹{q.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
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
                ))
              )}
            </div>
          )}

          {tab === "bookings" && (
            <div className="space-y-3">
              {contact.bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-3">No bookings yet for this contact</p>
                  <CreateBookingButton contactId={id} />
                </div>
              ) : (
                contact.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div>
                      <Link href={`/bookings/${booking.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        {booking.bookingRef.slice(0, 8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {booking.package?.name ?? "Custom"} · {format(new Date(booking.startDate), "MMM d")} – {format(new Date(booking.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "tasks" && (
            <div>
              <QuickTaskForm contactId={id} />
              <div className="space-y-3">
                {contact.tasks.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">No tasks yet. Create one above.</p>
                ) : (
                  contact.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{task.type.replace(/_/g, " ")}</span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-400">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                          )}
                          {task.assignee && (
                            <span className="text-xs text-gray-400">· {task.assignee.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_COLORS[task.status]}`}>
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "sequences" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{enrollments.length} enrollment{enrollments.length !== 1 ? "s" : ""}</p>
                <EnrollSequenceButton contactId={id} sequences={activeSequences} />
              </div>
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Not enrolled in any sequences.</p>
                  <p className="text-xs text-gray-400 mt-1">Use the button above to enroll.</p>
                </div>
              ) : (
                enrollments.map((enrollment) => {
                  const steps = enrollment.sequence.steps;
                  const total = enrollment.sequence._count.steps;
                  const current = enrollment.currentStep;
                  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
                  return (
                    <div key={enrollment.id} className="p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{enrollment.sequence.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Step {Math.min(current + 1, total)} of {total} ·{" "}
                            <span className={`font-medium ${
                              enrollment.status === "COMPLETED" ? "text-green-600" :
                              enrollment.status === "ACTIVE" ? "text-indigo-600" :
                              "text-gray-500"
                            }`}>{enrollment.status}</span>
                          </p>
                        </div>
                        {enrollment.nextSendAt && enrollment.status === "ACTIVE" && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            Next: {format(new Date(enrollment.nextSendAt), "MMM d, h:mm a")}
                          </span>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "activity" && (
            <div className="space-y-3">
              {contact.activities.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No activity yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                  {contact.activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-start gap-4 pb-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center z-10 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(activity.createdAt), "MMM d, yyyy · h:mm a")}
                          {activity.user && ` · ${activity.user.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              <AddNoteForm contactId={id} />
              {contact.noteRels.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">No notes yet. Add one above.</p>
              ) : (
                contact.noteRels.map((note) => (
                  <div key={note.id} className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {note.author?.name} · {format(new Date(note.createdAt), "MMM d, yyyy")}
                      </span>
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
