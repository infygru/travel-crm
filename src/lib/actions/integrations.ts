"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getIntegrationSettings() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const row = await db.integrationSettings.findUnique({ where: { id: "singleton" } })
  return row
}

export async function saveIntegrationSettings(data: {
  // Email
  resendApiKey?: string
  emailFromName?: string
  emailFromDomain?: string
  // Twilio
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioWhatsappNumber?: string
  twilioSmsNumber?: string
  // Facebook / Instagram
  facebookAppId?: string
  facebookAppSecret?: string
  // Twitter
  twitterClientId?: string
  twitterClientSecret?: string
  // LinkedIn
  linkedinClientId?: string
  linkedinClientSecret?: string
  // TikTok
  tiktokClientKey?: string
  tiktokClientSecret?: string
  // YouTube
  youtubeClientId?: string
  youtubeClientSecret?: string
  // Canva
  canvaClientId?: string
  canvaClientSecret?: string
  canvaRedirectUri?: string
  // AI
  anthropicApiKey?: string
  // App
  appUrl?: string
  cronSecret?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Blank strings → null (so env fallback kicks in)
  const clean = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v?.trim() || null])
  )

  await db.integrationSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...clean },
    update: clean,
  })

  revalidatePath("/settings")
  return { success: true }
}
