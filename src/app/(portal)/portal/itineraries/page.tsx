import { getPortalItineraries } from "@/lib/actions/portal"
import { format } from "date-fns"
import Link from "next/link"
import { Map, ExternalLink, CheckCircle2, Clock } from "lucide-react"

export default async function PortalItinerariesPage() {
  const itineraries = await getPortalItineraries()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
          <Map className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Itineraries</h1>
          <p className="text-gray-500 text-sm">{itineraries.length} itinerary{itineraries.length !== 1 ? "s" : ""} shared with you</p>
        </div>
      </div>

      {itineraries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold mb-2">No itineraries yet</p>
          <p className="text-gray-400 text-sm">Your travel agent will share itineraries here when they&apos;re ready for your review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {itineraries.map((itin) => {
            const totalDays = itin.days.length
            const locations = [...new Set(itin.days.map((d) => d.location).filter(Boolean))]

            return (
              <div key={itin.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header strip */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-gray-900 text-base flex-1">{itin.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${itin.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {itin.status === "APPROVED" ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{itin.status}</span>
                      ) : itin.status}
                    </span>
                  </div>

                  {/* Destinations */}
                  {locations.length > 0 && (
                    <p className="text-sm text-gray-500 mb-2">📍 {locations.join(" → ")}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span>{totalDays} days</span>
                    <span>{itin.currency} {itin.totalCost.toLocaleString()}</span>
                    {itin.startDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(itin.startDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {itin.shareToken && (
                      <a
                        href={`/itinerary/${itin.shareToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View &amp; Approve
                      </a>
                    )}
                    {itin.status === "APPROVED" && (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Approved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
