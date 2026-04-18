import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  MapPin,
  Clock,
  Users,
  Star,
} from "lucide-react";
import { NewPackageDialog } from "@/components/packages/new-package-dialog";
import { formatCurrency } from "@/lib/currency";
import { getCompanySettings } from "@/lib/actions/settings";

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
};

export default async function PackagesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [packages, settings] = await Promise.all([
    db.travelPackage.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { bookings: true, deals: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getCompanySettings(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Packages</h1>
          <p className="text-gray-500 mt-1">{packages.length} active packages</p>
        </div>
        <NewPackageDialog />
      </div>

      {/* Package Grid */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No packages yet</h3>
          <p className="text-gray-500 mt-1">Click &quot;New Package&quot; to create your first travel package</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                {pkg.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-white/50" />
                )}
              </div>

              <div className="p-5">
                {/* Category badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[pkg.category] ?? "bg-gray-100 text-gray-700"}`}>
                    {pkg.category.replace(/_/g, " ")}
                  </span>
                  {pkg.code && (
                    <span className="text-xs text-gray-400 font-mono">{pkg.code}</span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-gray-900 mb-1">{pkg.name}</h3>

                {/* Destinations */}
                {pkg.destinations.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{pkg.destinations.slice(0, 2).join(", ")}{pkg.destinations.length > 2 ? ` +${pkg.destinations.length - 2}` : ""}</span>
                  </div>
                )}

                {/* Description */}
                {pkg.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{pkg.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {pkg.duration} days
                  </div>
                  {pkg.maxPax && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Max {pkg.maxPax} pax
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    {pkg._count.bookings} bookings
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">From</p>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-indigo-600">
                        {formatCurrency(pkg.basePrice, settings.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/packages/${pkg.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/bookings?packageId=${pkg.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
