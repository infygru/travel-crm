import { getCompanyById } from "@/lib/actions/companies"
import { getCompanySettings } from "@/lib/actions/settings"
import { formatCurrency } from "@/lib/currency"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Globe, Mail, Phone, Users, Building2, TrendingUp, MapPin, Calendar } from "lucide-react"
import { LEAD_STATUS_COLORS, DEAL_STATUS_COLORS } from "@/lib/constants"
import { CompanyActions } from "./company-actions"

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>
}

const ACTIVITY_ICONS: Record<string, string> = {
  DEAL_CREATED: "💼",
  DEAL_WON: "🏆",
  DEAL_LOST: "❌",
  DEAL_STAGE_CHANGED: "🔄",
  NOTE_ADDED: "📝",
  CONTACT_CREATED: "👤",
  default: "•",
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = await params
  const [company, settings] = await Promise.all([
    getCompanyById(id),
    getCompanySettings(),
  ])
  if (!company) notFound()

  const totalDealValue = company.deals.reduce((sum, d) => sum + d.value, 0)
  const wonDeals = company.deals.filter(d => d.status === "WON")

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/companies" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Companies
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {company.industry && <span className="text-sm text-gray-500">{company.industry}</span>}
                  {company.size && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{company.size} employees</span>}
                  {(company.city || company.country) && (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {[company.city, company.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CompanyActions companyId={company.id} company={{
                  name: company.name,
                  website: company.website,
                  industry: company.industry,
                  size: company.size,
                  country: company.country,
                  city: company.city,
                  phone: company.phone,
                  email: company.email,
                  description: company.description,
                  revenue: company.revenue,
                }} />
              </div>
            </div>

            {/* Contact info row */}
            <div className="flex items-center gap-5 mt-4 flex-wrap">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700">
                  <Globe className="w-4 h-4" />
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {company.email && (
                <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <Mail className="w-4 h-4" />
                  {company.email}
                </a>
              )}
              {company.phone && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Phone className="w-4 h-4" />
                  {company.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{company._count.contacts}</p>
            <p className="text-xs text-gray-500 mt-0.5">Contacts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{company._count.deals}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Deals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{wonDeals.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Won Deals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDealValue, settings.currency, { compact: true })}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pipeline Value</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Contacts ({company.contacts.length})
              </h2>
              <Link href={`/contacts/new`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                + Add Contact
              </Link>
            </div>
            {company.contacts.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No contacts linked to this company</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {company.contacts.map((contact) => (
                  <Link key={contact.id} href={`/contacts/${contact.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                        {contact.jobTitle && <p className="text-xs text-gray-400">{contact.jobTitle}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {contact.email && <p className="text-xs text-gray-400 hidden sm:block">{contact.email}</p>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAD_STATUS_COLORS[contact.leadStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {contact.leadStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Deals */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                Deals ({company.deals.length})
              </h2>
            </div>
            {company.deals.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No deals linked to this company</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {company.deals.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {deal.stage && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deal.stage.color }} />
                            {deal.stage.name}
                          </span>
                        )}
                        {deal.owner && <span className="text-xs text-gray-400">{deal.owner.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEAL_STATUS_COLORS[deal.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {deal.status}
                      </span>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(deal.value, settings.currency)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {company.activities.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {company.activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0">{ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.default}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activity.user?.name && <span className="text-xs text-gray-400">{activity.user.name}</span>}
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{format(new Date(activity.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              Details
            </h2>
            <div className="space-y-3">
              {[
                { label: "Industry", value: company.industry },
                { label: "Size", value: company.size ? `${company.size} employees` : null },
                { label: "Country", value: company.country },
                { label: "City", value: company.city },
                { label: "Revenue", value: company.revenue ? formatCurrency(company.revenue, settings.currency, { compact: true }) : null },
                { label: "Added", value: format(new Date(company.createdAt), "MMM d, yyyy") },
              ].filter(item => item.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            {company.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1.5">About</p>
                <p className="text-sm text-gray-600 leading-relaxed">{company.description}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {company.notes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Notes</h2>
              <div className="space-y-3">
                {company.notes.slice(0, 3).map((note) => (
                  <div key={note.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {note.author?.name?.[0] ?? "?"}
                      </div>
                      <span className="text-xs font-medium text-gray-600">{note.author?.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{format(new Date(note.createdAt), "MMM d")}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
