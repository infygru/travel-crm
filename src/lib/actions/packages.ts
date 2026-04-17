"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getPackageById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return db.travelPackage.findUnique({
    where: { id },
    include: {
      bookings: {
        select: { id: true, bookingRef: true, status: true, totalAmount: true, startDate: true, endDate: true, contact: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      deals: {
        select: { id: true, title: true, value: true, currency: true, status: true, contact: { select: { id: true, firstName: true, lastName: true } }, stage: { select: { name: true, color: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { bookings: true, deals: true } },
      itinerary: { orderBy: { day: "asc" } },
    },
  })
}

export async function getPackages(params?: { isActive?: boolean; category?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return db.travelPackage.findMany({
    where: {
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.category ? { category: params.category as never } : {}),
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function createPackage(data: {
  name: string
  code?: string
  description?: string
  category: string
  duration: number
  basePrice: number
  currency?: string
  maxPax?: number
  destinations?: string[]
  imageUrl?: string
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const pkg = await db.travelPackage.create({
    data: {
      name: data.name,
      code: data.code || undefined,
      description: data.description,
      category: data.category as never,
      duration: data.duration,
      basePrice: data.basePrice,
      currency: data.currency ?? "INR",
      maxPax: data.maxPax,
      destinations: data.destinations ?? [],
      inclusions: [],
      exclusions: [],
      highlights: [],
      imageUrl: data.imageUrl || undefined,
    },
  })

  revalidatePath("/packages")
  return pkg
}

export async function updatePackage(id: string, data: Partial<{
  name: string
  code: string
  description: string
  category: string
  duration: number
  basePrice: number
  currency: string
  maxPax: number
  destinations: string[]
  inclusions: string[]
  exclusions: string[]
  highlights: string[]
  isActive: boolean
  imageUrl: string
}>) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const pkg = await db.travelPackage.update({
    where: { id },
    data: {
      ...data,
      category: data.category as never,
    },
  })

  revalidatePath("/packages")
  return pkg
}

export async function deletePackage(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.travelPackage.update({ where: { id }, data: { isActive: false } })
  revalidatePath("/packages")
  return { success: true }
}

export async function getPackageWithDays(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return db.travelPackage.findUnique({
    where: { id },
    include: {
      itinerary: { orderBy: { day: "asc" } },
    },
  })
}

export async function addPackageDay(packageId: string, data: {
  day: number
  title: string
  location?: string
  description?: string
  accommodation?: string
  transport?: string
  meals?: string[]
  activities?: string[]
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const d = await db.itineraryDay.create({
    data: {
      packageId,
      day: data.day,
      title: data.title,
      location: data.location,
      description: data.description,
      accommodation: data.accommodation,
      transport: data.transport,
      meals: data.meals ?? [],
      activities: data.activities ?? [],
    },
  })
  revalidatePath(`/packages/${packageId}`)
  return d
}

export async function updatePackageDay(dayId: string, packageId: string, data: {
  title?: string
  location?: string
  description?: string
  accommodation?: string
  transport?: string
  meals?: string[]
  activities?: string[]
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const d = await db.itineraryDay.update({
    where: { id: dayId },
    data,
  })
  revalidatePath(`/packages/${packageId}`)
  return d
}

export async function removePackageDay(dayId: string, packageId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  await db.itineraryDay.delete({ where: { id: dayId } })
  revalidatePath(`/packages/${packageId}`)
  return { success: true }
}
