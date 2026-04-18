import { getItineraryById } from "@/lib/actions/itineraries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { ITINERARY_STATUS_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import { ItineraryBuilder } from "./itinerary-builder";
import { ConvertToBookingButton } from "./itinerary-actions";

interface ItineraryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItineraryDetailPage({ params }: ItineraryDetailPageProps) {
  const { id } = await params;
  const itinerary = await getItineraryById(id);
  if (!itinerary) notFound();

  const shareUrl = itinerary.shareToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/itinerary/${itinerary.shareToken}`
    : null;

  return (
    <div className="space-y-4 max-w-5xl">
      <Link href="/itineraries" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Itineraries
      </Link>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{itinerary.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ITINERARY_STATUS_COLORS[itinerary.status]}`}>
                  {itinerary.status}
                </span>
                <span className="text-xs text-gray-400">v{itinerary.version}</span>
                {itinerary.startDate && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(itinerary.startDate), "MMM d")}
                    {itinerary.endDate ? ` – ${format(new Date(itinerary.endDate), "MMM d, yyyy")}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{itinerary.totalCost.toLocaleString("en-IN")}
              </p>
            </div>
            <ConvertToBookingButton
              itineraryId={itinerary.id}
              status={itinerary.status}
              totalCost={itinerary.totalCost}
            />
            <a
              href={`/api/pdf/itinerary/${itinerary.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
            {shareUrl && (
              <a
                href={shareUrl}
                target="_blank"
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Preview
              </a>
            )}
          </div>
        </div>

        {/* Contact / Deal info */}
        {(itinerary.contact || itinerary.deal) && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            {itinerary.contact && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Contact:</span>
                <Link href={`/contacts/${itinerary.contact.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  {itinerary.contact.firstName} {itinerary.contact.lastName}
                </Link>
              </div>
            )}
            {itinerary.deal && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Deal:</span>
                <Link href={`/deals/${itinerary.deal.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  {itinerary.deal.title}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Builder */}
      <ItineraryBuilder
        itinerary={itinerary}
        contactEmail={itinerary.contact?.email ?? null}
        contactName={itinerary.contact ? `${itinerary.contact.firstName} ${itinerary.contact.lastName}` : null}
      />
    </div>
  );
}
