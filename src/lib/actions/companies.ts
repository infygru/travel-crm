"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getCompanyById(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return db.company.findUnique({
    where: { id },
    include: {
      contacts: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, leadStatus: true, jobTitle: true },
        orderBy: { firstName: "asc" },
      },
      deals: {
        include: { stage: { select: { name: true, color: true } }, owner: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      notes: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { contacts: true, deals: true } },
    },
  })
}

export async function createCompany(data: {
  name: string
  website?: string
  industry?: string
  size?: string
  country?: string
  city?: string
  phone?: string
  email?: string
  description?: string
  revenue?: number
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const company = await db.company.create({
    data: {
      name: data.name,
      website: data.website || undefined,
      industry: data.industry || undefined,
      size: data.size || undefined,
      country: data.country || undefined,
      city: data.city || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      description: data.description || undefined,
      revenue: data.revenue,
    },
  })

  revalidatePath("/companies")
  return company
}

export async function updateCompany(id: string, data: Partial<{
  name: string
  website: string
  industry: string
  size: string
  country: string
  city: string
  phone: string
  email: string
  description: string
  revenue: number
}>) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const company = await db.company.update({ where: { id }, data })
  revalidatePath("/companies")
  return company
}

export async function deleteCompany(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.company.delete({ where: { id } })
  revalidatePath("/companies")
  return { success: true }
}
