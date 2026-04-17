"use server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createCanvaDesign } from "@/lib/canva"

export async function getCanvaDesigns(filters?: { contactId?: string; itineraryId?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  return db.canvaDesign.findMany({
    where: {
      ...(filters?.contactId ? { contactId: filters.contactId } : {}),
      ...(filters?.itineraryId ? { itineraryId: filters.itineraryId } : {}),
    },
    include: { createdBy: true, contact: true, itinerary: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function saveCanvaDesign(data: {
  canvaId: string
  title: string
  designType: string
  editUrl?: string
  contactId?: string
  itineraryId?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const design = await db.canvaDesign.upsert({
    where: { canvaId: data.canvaId },
    create: { ...data, createdById: session.user.id },
    update: { title: data.title, editUrl: data.editUrl },
  })
  revalidatePath("/posters")
  return design
}

export async function createDesignViaCanva(data: {
  title: string
  designType: string
  contactId?: string
  itineraryId?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const cookieStore = await cookies()
  const accessToken = cookieStore.get("canva_token")?.value

  if (!accessToken) {
    // No Canva connection — save a local placeholder
    const canvaId = `local-${Date.now()}`
    const design = await db.canvaDesign.create({
      data: {
        canvaId,
        title: data.title,
        designType: data.designType,
        contactId: data.contactId,
        itineraryId: data.itineraryId,
        createdById: session.user.id,
      },
    })
    revalidatePath("/posters")
    return { design, editUrl: null, opened: false }
  }

  // Call Canva API to create a real design
  const result = await createCanvaDesign(accessToken, data.title, data.designType)
  const canvaId: string | undefined = result?.design?.id
  const editUrl: string | undefined = result?.design?.urls?.edit_url

  if (!canvaId) {
    // Canva API failed (token expired, etc.) — fall back to placeholder
    const localId = `local-${Date.now()}`
    const design = await db.canvaDesign.create({
      data: {
        canvaId: localId,
        title: data.title,
        designType: data.designType,
        contactId: data.contactId,
        itineraryId: data.itineraryId,
        createdById: session.user.id,
      },
    })
    revalidatePath("/posters")
    return { design, editUrl: null, opened: false }
  }

  const design = await db.canvaDesign.create({
    data: {
      canvaId,
      title: data.title,
      designType: data.designType,
      editUrl: editUrl ?? null,
      contactId: data.contactId,
      itineraryId: data.itineraryId,
      createdById: session.user.id,
    },
  })

  revalidatePath("/posters")
  return { design, editUrl: editUrl ?? null, opened: true }
}

export async function deleteCanvaDesign(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  await db.canvaDesign.delete({ where: { id } })
  revalidatePath("/posters")
}
