"use server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { autofillCanvaTemplate, getAutofillJob, listBrandTemplates } from "@/lib/canva"

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

export async function deleteCanvaDesign(id: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  await db.canvaDesign.delete({ where: { id } })
  revalidatePath("/posters")
}

export async function getCanvaToken() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { canvaToken: true } })
  return user?.canvaToken ?? null
}

export async function getBrandTemplates() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { canvaToken: true } })
  if (!user?.canvaToken) throw new Error("Canva not connected")
  return listBrandTemplates(user.canvaToken)
}

export async function generatePosterFromItinerary(itineraryId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const [user, itinerary, settings] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { canvaToken: true } }),
    db.itinerary.findUnique({
      where: { id: itineraryId },
      include: { days: { include: { items: true }, orderBy: { dayNumber: "asc" } }, contact: true },
    }),
    db.companySettings.findUnique({ where: { id: "singleton" }, select: { canvaTemplateId: true } }),
  ])

  if (!user?.canvaToken) throw new Error("Canva not connected. Please connect Canva first.")
  if (!itinerary) throw new Error("Itinerary not found")
  if (!settings?.canvaTemplateId) throw new Error("No Canva template configured. Please add a template ID in Settings.")

  // Build autofill data from itinerary
  const startDate = itinerary.startDate ? new Date(itinerary.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""
  const endDate = itinerary.endDate ? new Date(itinerary.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""
  const duration = itinerary.days.length > 0 ? `${itinerary.days.length} Days` : ""
  const highlights = itinerary.days
    .slice(0, 4)
    .map((d) => d.title ?? d.items[0]?.title ?? `Day ${d.dayNumber}`)
    .join(" • ")

  const fields: Record<string, string> = {
    destination: itinerary.title,
    dates: startDate && endDate ? `${startDate} – ${endDate}` : startDate || "",
    duration,
    highlights,
    contact: itinerary.contact ? `${itinerary.contact.firstName} ${itinerary.contact.lastName}`.trim() : "",
    description: itinerary.description ?? "",
  }

  // Start autofill job
  const jobResponse = await autofillCanvaTemplate(
    user.canvaToken,
    settings.canvaTemplateId,
    `${itinerary.title} Poster`,
    fields
  )

  const jobId = jobResponse?.job?.id
  if (!jobId) throw new Error(`Autofill failed: ${JSON.stringify(jobResponse)}`)

  // Poll for job completion (max 15s)
  let job = jobResponse.job
  for (let i = 0; i < 15; i++) {
    if (job.status === "success") break
    if (job.status === "failed") throw new Error("Canva autofill job failed")
    await new Promise((r) => setTimeout(r, 1000))
    const polled = await getAutofillJob(user.canvaToken, jobId)
    job = polled.job
  }

  if (job.status !== "success" || !job.result?.design) throw new Error("Autofill timed out or failed")

  const design = job.result.design
  const saved = await db.canvaDesign.create({
    data: {
      canvaId: design.id,
      title: `${itinerary.title} Poster`,
      designType: "POSTER",
      editUrl: design.urls.edit_url,
      itineraryId,
      createdById: session.user.id,
    },
  })

  revalidatePath("/posters")
  return { design: saved, editUrl: design.urls.edit_url }
}

export async function saveCanvaTemplateId(templateId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  await db.companySettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", canvaTemplateId: templateId },
    update: { canvaTemplateId: templateId },
  })
  revalidatePath("/posters")
}

export async function getCanvaTemplateId() {
  const settings = await db.companySettings.findUnique({ where: { id: "singleton" }, select: { canvaTemplateId: true } })
  return settings?.canvaTemplateId ?? null
}
