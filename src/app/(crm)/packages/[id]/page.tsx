import { getPackageById } from "@/lib/actions/packages"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Package, MapPin, Clock, Users, DollarSign, CheckCircle, XCircle, Star, TrendingUp } from "lucide-react"
import { BOOKING_STATUS_COLORS, DEAL_STATUS_COLORS } from "@/lib/constants"
import { PackageActions } from "./package-actions"
import { PackageDayEditor } from "@/components/packages/package-day-editor"
import { formatCurrency } from "@/lib/currency"
import { getCompanySettings } from "@/lib/actions/settings"

interface PackageDetailPageProps {
  params: Promise<{ id: string }>
}

const CATEGORY_COLORS: Record<string, string> = {
  ADVENTURE: "bg-orange-100 text-orange-700",
  LUXURY: "bg-purple-100 text-purple-700",
  FAMILY: "bg-blue-100 text-blue-700",
  HONEYMOON: "bg-pink-100 text-pink-700",
  BUSINESS: "bg-gray-100 text-gray-700",
  GROUP_TOUR: "bg-indigo-100 text-indigo-700",
  CRUISE: "bg-cyan-100 text-cyan-700",
  SAFARI: "bg-amber-100 text-amber-700",
  BEACH: "bg-teal-100 text-teal-700",
  CULTURAL: "bg-violet-100 text-violet-700",
  PILGRIMAGE: "bg-yellow-100 text-yellow-700",
  SPORTS: "bg-green-100 text-green-700",
  OTHER: "bg-gray-100 text-gray-700",
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params
  const [pkg, settings] = await Promise.all([getPackageById(id), getCompanySettings()])
  if (!pkg) notFound()

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/packages" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Packages
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          {pkg.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-6 flex items-end gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[pkg.category] ?? "bg-gray-100 text-gray-700"}`}>
                  {pkg.category.replace(/_/g, " ")}
                </span>
                {pkg.code && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{pkg.code}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{pkg.name}</h1>
              {pkg.destinations.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {pkg.destinations.join(" → ")}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PackageActions packageId={pkg.id} pkg={{
                name: pkg.name,
                code: pkg.code,
                category: pkg.category,
                description: pkg.description,
                duration: pkg.duration,
                basePrice: pkg.basePrice,
                currency: pkg.currency,
                maxPax: pkg.maxPax,
                destinations: pkg.destinations,
                inclusions: pkg.inclusions,
                exclusions: pkg.exclusions,
                highlights: pkg.highlights,
                isActive: pkg.isActive,
                imageUrl: pkg.imageUrl,
              }} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(pkg.basePrice, settings.currency)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Base Price</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{pkg.duration}</p>
              <p className="text-xs text-gray-500 mt-0.5">Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{pkg._count.bookings}</p>
              <p className="text-xs text-gray-500 mt-0.5">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{pkg._count.deals}</p>
              <p className="text-xs text-gray-500 mt-0.5">Deals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Destinations */}
          {pkg.destinations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Destinations
              </h2>
              <div className="flex flex-wrap gap-2">
                {pkg.destinations.map((dest, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full">
                    <MapPin className="w-3.5 h-3.5" />
                    {dest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inclusions / Exclusions / Highlights */}
          {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0 || pkg.highlights.length > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Package Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {pkg.highlights.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> Highlights
                    </h3>
                    <ul className="space-y-1">
                      {pkg.highlights.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="text-amber-400 mt-0.5">★</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pkg.inclusions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Inclusions
                    </h3>
                    <ul className="space-y-1">
                      {pkg.inclusions.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pkg.exclusions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Exclusions
                    </h3>
                    <ul className="space-y-1">
                      {pkg.exclusions.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="text-red-400 mt-0.5">✗</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Day-by-Day Programme */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Day-by-Day Programme</h2>
                <p className="text-xs text-gray-500 mt-0.5">Define hotel, transport, activities and meals for each day</p>
              </div>
              <span className="text-xs text-gray-400">{pkg.duration} days total</span>
            </div>
            <div className="p-6">
              <PackageDayEditor packageId={pkg.id} initialDays={pkg.itinerary} />
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Recent Bookings ({pkg._count.bookings})</h2>
              <Link href={`/bookings?packageId=${pkg.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
            </div>
            {pkg.bookings.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No bookings yet for this package</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pkg.bookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">{booking.bookingRef.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {booking.contact?.firstName} {booking.contact?.lastName}
                        {booking.startDate && ` · ${format(new Date(booking.startDate), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {booking.status}
                      </span>
                      {booking.totalAmount != null && (
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(booking.totalAmount, settings.currency)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Related Deals */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Related Deals ({pkg._count.deals})</h2>
            </div>
            {pkg.deals.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No deals linked to this package</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pkg.deals.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {deal.contact?.firstName} {deal.contact?.lastName}
                        {deal.stage && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deal.stage.color }} />
                            {deal.stage.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEAL_STATUS_COLORS[deal.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {deal.status}
                      </span>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value, settings.currency)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              Package Info
            </h2>
            <div className="space-y-3">
              {[
                { label: "Category", value: pkg.category.replace(/_/g, " ") },
                { label: "Duration", value: `${pkg.duration} days` },
                { label: "Currency", value: pkg.currency },
                { label: "Base Price", value: formatCurrency(pkg.basePrice, settings.currency) },
                { label: "Max Pax", value: pkg.maxPax ? `${pkg.maxPax} persons` : null },
                { label: "Status", value: pkg.isActive ? "Active" : "Inactive" },
                { label: "Created", value: format(new Date(pkg.createdAt), "MMM d, yyyy") },
              ].filter(item => item.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            {pkg.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{pkg.description}</p>
              </div>
            )}
          </div>

          {/* Quick Book */}
          <Link
            href={`/bookings?packageId=${pkg.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Create Booking
          </Link>
        </div>
      </div>
    </div>
  )
}
