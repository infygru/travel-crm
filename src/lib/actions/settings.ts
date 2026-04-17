"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

export async function getCompanySettings() {
  const settings = await db.companySettings.findUnique({ where: { id: "singleton" } })
  if (settings) return settings
  // Auto-create singleton row if first time
  return db.companySettings.create({ data: { id: "singleton" } })
}

export async function updateCompanySettings(data: {
  companyName: string
  logoUrl?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  gstin?: string
  pan?: string
  invoicePrefix?: string
  invoiceFooter?: string
  currency?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const settings = await db.companySettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  })

  revalidatePath("/settings")
  return settings
}

// Pipeline stage management
export async function createPipelineStage(pipelineId: string, data: {
  name: string
  color: string
  probability: number
  order: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const stage = await db.pipelineStage.create({
    data: { pipelineId, ...data },
  })
  revalidatePath("/settings")
  revalidatePath("/deals")
  return stage
}

export async function updatePipelineStage(stageId: string, data: {
  name?: string
  color?: string
  probability?: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const stage = await db.pipelineStage.update({ where: { id: stageId }, data })
  revalidatePath("/settings")
  revalidatePath("/deals")
  return stage
}

export async function deletePipelineStage(stageId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const count = await db.deal.count({ where: { stageId } })
  if (count > 0) throw new Error(`Cannot delete: ${count} deal(s) are in this stage. Move them first.`)

  await db.pipelineStage.delete({ where: { id: stageId } })
  revalidatePath("/settings")
  revalidatePath("/deals")
}

export async function reorderPipelineStages(stageIds: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await Promise.all(stageIds.map((id, idx) =>
    db.pipelineStage.update({ where: { id }, data: { order: idx + 1 } })
  ))
  revalidatePath("/settings")
  revalidatePath("/deals")
}

export async function createPipeline(name: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const pipeline = await db.pipeline.create({
    data: {
      name,
      stages: {
        create: [
          { name: "New Lead", order: 1, color: "#6366f1", probability: 10 },
          { name: "Qualified", order: 2, color: "#8b5cf6", probability: 30 },
          { name: "Proposal Sent", order: 3, color: "#ec4899", probability: 50 },
          { name: "Negotiation", order: 4, color: "#f59e0b", probability: 75 },
          { name: "Won", order: 5, color: "#10b981", probability: 100 },
        ],
      },
    },
  })
  revalidatePath("/settings")
  revalidatePath("/deals")
  return pipeline
}

export async function updateProfile(data: {
  name: string
  phone?: string
  department?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      phone: data.phone || undefined,
      department: data.department || undefined,
    },
  })

  revalidatePath("/settings")
  return user
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user?.password) throw new Error("No password set")

  const valid = await bcrypt.compare(data.currentPassword, user.password)
  if (!valid) throw new Error("Current password is incorrect")

  const hashed = await bcrypt.hash(data.newPassword, 12)
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } })

  return { success: true }
}

export async function inviteTeamMember(data: {
  name: string
  email: string
  role: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await db.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error("A user with this email already exists")

  const tempPassword = Math.random().toString(36).slice(-10)
  const hashed = await bcrypt.hash(tempPassword, 12)

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role as never,
      password: hashed,
    },
  })

  revalidatePath("/settings")
  return { user, tempPassword }
}
