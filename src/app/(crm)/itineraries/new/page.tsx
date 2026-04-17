import { getContacts } from "@/lib/actions/contacts";
import { getPackages } from "@/lib/actions/packages";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { NewItineraryForm } from "./new-itinerary-form";

interface NewItineraryPageProps {
  searchParams: Promise<{
    dealId?: string;
    contactId?: string;
    packageId?: string;
  }>;
}

export default async function NewItineraryPage({ searchParams }: NewItineraryPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;

  // Fetch deal context if coming from a deal
  const deal = params.dealId
    ? await db.deal.findUnique({
        where: { id: params.dealId },
        select: {
          id: true,
          title: true,
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          package: { select: { id: true, name: true, duration: true, currency: true, destinations: true } },
        },
      })
    : null;

  const [{ contacts }, packages] = await Promise.all([
    getContacts({ limit: 200 }),
    getPackages({ isActive: true }),
  ]);

  // Resolve defaults from URL params or deal context
  const defaultContactId = params.contactId ?? deal?.contact?.id ?? "";
  const defaultPackageId = params.packageId ?? deal?.package?.id ?? "";
  const defaultDealId = params.dealId ?? "";

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={deal ? `/deals/${deal.id}?tab=itineraries` : "/itineraries"} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        {deal ? `Back to ${deal.title}` : "Back to Itineraries"}
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Map className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Itinerary</h1>
          <p className="text-sm text-gray-500">
            {deal
              ? `Building itinerary for ${deal.contact?.firstName ?? deal.title}`
              : "Create a travel itinerary for a client"}
          </p>
        </div>
      </div>

      {/* Context banner when coming from a deal */}
      {deal && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
              {deal.contact?.firstName?.[0] ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {deal.contact?.firstName} {deal.contact?.lastName}
                {deal.contact?.email && <span className="text-xs text-gray-500 font-normal ml-2">{deal.contact.email}</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Deal: {deal.title}</p>
              {deal.package && (
                <p className="text-xs text-indigo-600 mt-0.5 font-medium">
                  Package: {deal.package.name}
                  {deal.package.destinations.length > 0 && ` · ${deal.package.destinations.join(" → ")}`}
                  {` · ${deal.package.duration} days`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <NewItineraryForm
        contacts={contacts as Array<{ id: string; firstName: string; lastName: string; email: string | null }>}
        packages={packages as Array<{ id: string; name: string; duration: number; currency: string; destinations: string[] }>}
        defaultContactId={defaultContactId}
        defaultPackageId={defaultPackageId}
        defaultDealId={defaultDealId}
        dealTitle={deal?.title}
      />
    </div>
  );
}
