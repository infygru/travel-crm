"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ItineraryItemType, ItineraryStatus } from "@prisma/client";
import { sendItineraryShare } from "@/lib/email";

export async function getItineraryStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const [draft, shared, approved, total] = await Promise.all([
    db.itinerary.count({ where: { status: "DRAFT" } }),
    db.itinerary.count({ where: { status: "SHARED" } }),
    db.itinerary.count({ where: { status: "APPROVED" } }),
    db.itinerary.count(),
  ]);

  return { draft, shared, approved, total };
}

export async function getItineraries(params?: {
  contactId?: string;
  dealId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params?.contactId) where.contactId = params.contactId;
  if (params?.dealId) where.dealId = params.dealId;
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.title = { contains: params.search, mode: "insensitive" };
  }

  const [itineraries, total] = await Promise.all([
    db.itinerary.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { days: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.itinerary.count({ where }),
  ]);

  return { itineraries, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getItineraryById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.itinerary.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      deal: { select: { id: true, title: true, packageId: true } },
      createdBy: { select: { id: true, name: true } },
      days: {
        include: {
          items: { orderBy: { order: "asc" } },
        },
        orderBy: { dayNumber: "asc" },
      },
    },
  });
}

export async function createItinerary(data: {
  title: string;
  description?: string;
  contactId?: string;
  dealId?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const itinerary = await db.itinerary.create({
    data: {
      title: data.title,
      description: data.description,
      contactId: data.contactId,
      dealId: data.dealId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      currency: data.currency ?? "INR",
      notes: data.notes,
      createdById: session.user.id,
    },
  });

  revalidatePath("/itineraries");
  return itinerary;
}

export async function updateItinerary(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    currency: string;
    notes: string;
    status: string;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const itinerary = await db.itinerary.update({
    where: { id },
    data: {
      ...data,
      status: data.status as ItineraryStatus | undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  revalidatePath(`/itineraries/${id}`);
  revalidatePath("/itineraries");
  return itinerary;
}

export async function shareItinerary(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const itinerary = await db.itinerary.update({
    where: { id },
    data: { status: "SHARED", sharedAt: new Date() },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
      days: { select: { id: true } },
    },
  });

  revalidatePath(`/itineraries/${id}`);
  revalidatePath("/itineraries");

  // Send email to contact non-blocking
  if (itinerary.contact?.email && itinerary.shareToken) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    sendItineraryShare({
      contactName: `${itinerary.contact.firstName} ${itinerary.contact.lastName}`,
      contactEmail: itinerary.contact.email,
      itineraryTitle: itinerary.title,
      shareUrl: `${appUrl}/itinerary/${itinerary.shareToken}`,
      agentName: session.user.name ?? "Your Travel Agent",
      days: itinerary.days.length,
      totalCost: itinerary.totalCost,
      currency: itinerary.currency,
    }).catch(() => {});
  }

  return itinerary;
}

export async function getPublicItinerary(shareToken: string) {
  // No auth check - public route
  return db.itinerary.findUnique({
    where: { shareToken },
    include: {
      contact: { select: { firstName: true, lastName: true } },
      days: {
        include: {
          items: { orderBy: { order: "asc" } },
        },
        orderBy: { dayNumber: "asc" },
      },
    },
  });
}

export async function approveItinerary(shareToken: string) {
  // No auth check - public route
  const itinerary = await db.itinerary.update({
    where: { shareToken },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  revalidatePath(`/itineraries/${itinerary.id}`);
  return itinerary;
}

export async function addDayPlan(
  itineraryId: string,
  data: {
    dayNumber: number;
    date?: string;
    title?: string;
    description?: string;
    location?: string;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const dayPlan = await db.itineraryDayPlan.create({
    data: {
      itineraryId,
      dayNumber: data.dayNumber,
      date: data.date ? new Date(data.date) : undefined,
      title: data.title,
      description: data.description,
      location: data.location,
    },
  });

  revalidatePath(`/itineraries/${itineraryId}`);
  return dayPlan;
}

export async function updateDayPlan(
  dayPlanId: string,
  data: Partial<{
    date: string;
    title: string;
    description: string;
    location: string;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const dayPlan = await db.itineraryDayPlan.update({
    where: { id: dayPlanId },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

  revalidatePath(`/itineraries/${dayPlan.itineraryId}`);
  return dayPlan;
}

export async function removeDayPlan(dayPlanId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const dayPlan = await db.itineraryDayPlan.delete({ where: { id: dayPlanId } });
  revalidatePath(`/itineraries/${dayPlan.itineraryId}`);
  return { success: true };
}

export async function addItineraryItem(
  dayPlanId: string,
  data: {
    type: string;
    title: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    supplier?: string;
    confirmationRef?: string;
    unitCost?: number;
    quantity?: number;
    currency?: string;
    isIncluded?: boolean;
    notes?: string;
    order?: number;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const unitCost = data.unitCost ?? 0;
  const quantity = data.quantity ?? 1;
  const totalCost = unitCost * quantity;

  // Get current max order for this day plan
  const maxOrder = await db.itineraryItem.aggregate({
    where: { dayPlanId },
    _max: { order: true },
  });
  const order = data.order ?? (maxOrder._max.order ?? -1) + 1;

  const item = await db.itineraryItem.create({
    data: {
      dayPlanId,
      order,
      type: data.type as ItineraryItemType,
      title: data.title,
      description: data.description,
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      supplier: data.supplier,
      confirmationRef: data.confirmationRef,
      unitCost,
      quantity,
      totalCost,
      currency: data.currency ?? "INR",
      isIncluded: data.isIncluded ?? true,
      notes: data.notes,
    },
  });

  // Update itinerary totalCost
  const dayPlan = await db.itineraryDayPlan.findUnique({ where: { id: dayPlanId } });
  if (dayPlan) {
    await recalculateItineraryTotal(dayPlan.itineraryId);
  }

  revalidatePath(`/itineraries/${dayPlan?.itineraryId}`);
  return item;
}

export async function updateItineraryItem(
  itemId: string,
  data: Partial<{
    type: string;
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    duration: number;
    supplier: string;
    confirmationRef: string;
    unitCost: number;
    quantity: number;
    currency: string;
    isIncluded: boolean;
    notes: string;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const existing = await db.itineraryItem.findUnique({
    where: { id: itemId },
    include: { dayPlan: true },
  });
  if (!existing) throw new Error("Item not found");

  const unitCost = data.unitCost ?? existing.unitCost;
  const quantity = data.quantity ?? existing.quantity;
  const totalCost = unitCost * quantity;

  const item = await db.itineraryItem.update({
    where: { id: itemId },
    data: {
      ...data,
      type: data.type as ItineraryItemType | undefined,
      unitCost,
      quantity,
      totalCost,
    },
  });

  await recalculateItineraryTotal(existing.dayPlan.itineraryId);
  revalidatePath(`/itineraries/${existing.dayPlan.itineraryId}`);
  return item;
}

export async function removeItineraryItem(itemId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const item = await db.itineraryItem.findUnique({
    where: { id: itemId },
    include: { dayPlan: true },
  });
  if (!item) throw new Error("Item not found");

  await db.itineraryItem.delete({ where: { id: itemId } });
  await recalculateItineraryTotal(item.dayPlan.itineraryId);
  revalidatePath(`/itineraries/${item.dayPlan.itineraryId}`);
  return { success: true };
}

export async function importDaysFromPackage(itineraryId: string, packageId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const pkg = await db.travelPackage.findUnique({
    where: { id: packageId },
    include: { itinerary: { orderBy: { day: "asc" } } },
  });
  if (!pkg || pkg.itinerary.length === 0) throw new Error("Package has no day plan defined");

  // Remove existing days first
  await db.itineraryDayPlan.deleteMany({ where: { itineraryId } });

  // Create new days from package
  for (const pkgDay of pkg.itinerary) {
    let order = 0;
    const dayPlan = await db.itineraryDayPlan.create({
      data: {
        itineraryId,
        dayNumber: pkgDay.day,
        title: pkgDay.title,
        location: pkgDay.location,
        description: pkgDay.description,
      },
    });

    // Map package day content to itinerary items
    const items: Omit<Parameters<typeof db.itineraryItem.create>[0]["data"], "dayPlanId">[] = [];

    if (pkgDay.accommodation) {
      items.push({ order: order++, type: "HOTEL", title: pkgDay.accommodation, isIncluded: true, unitCost: 0, quantity: 1, totalCost: 0, currency: pkg.currency });
    }
    if (pkgDay.transport) {
      items.push({ order: order++, type: "TRANSFER", title: pkgDay.transport, isIncluded: true, unitCost: 0, quantity: 1, totalCost: 0, currency: pkg.currency });
    }
    for (const activity of pkgDay.activities) {
      items.push({ order: order++, type: "ACTIVITY", title: activity, isIncluded: true, unitCost: 0, quantity: 1, totalCost: 0, currency: pkg.currency });
    }
    for (const meal of pkgDay.meals) {
      items.push({ order: order++, type: "MEAL", title: meal, isIncluded: true, unitCost: 0, quantity: 1, totalCost: 0, currency: pkg.currency });
    }

    if (items.length > 0) {
      await db.itineraryItem.createMany({
        data: items.map(item => ({ ...item, dayPlanId: dayPlan.id })),
      });
    }
  }

  revalidatePath(`/itineraries/${itineraryId}`);
  return { success: true, days: pkg.itinerary.length };
}

async function recalculateItineraryTotal(itineraryId: string) {
  const agg = await db.itineraryItem.aggregate({
    where: {
      dayPlan: { itineraryId },
      isIncluded: true,
    },
    _sum: { totalCost: true },
  });

  await db.itinerary.update({
    where: { id: itineraryId },
    data: { totalCost: agg._sum.totalCost ?? 0 },
  });
}
