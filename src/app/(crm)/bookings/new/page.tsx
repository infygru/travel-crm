import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NewBookingForm } from "./new-booking-form";

interface NewBookingPageProps {
  searchParams: Promise<{
    contactId?: string;
    dealId?: string;
    packageId?: string;
  }>;
}

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;

  const [contacts, packages, preContact] = await Promise.all([
    db.contact.findMany({
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
      take: 300,
    }),
    db.travelPackage.findMany({
      where: { isActive: true },
      select: { id: true, name: true, basePrice: true, currency: true, duration: true, destinations: true },
      orderBy: { name: "asc" },
    }),
    params.contactId
      ? db.contact.findUnique({
          where: { id: params.contactId },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        })
      : null,
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {preContact
            ? `Creating booking for ${preContact.firstName} ${preContact.lastName}`
            : "Create a new travel booking"}
        </p>
      </div>
      <NewBookingForm
        contacts={contacts}
        packages={packages}
        defaultContactId={params.contactId}
        defaultPackageId={params.packageId}
        dealId={params.dealId}
        preContact={preContact}
      />
    </div>
  );
}
