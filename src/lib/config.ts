// ─────────────────────────────────────────────
// INTEGRATION CONFIG LOADER
// DB values take precedence over env vars.
// All integrations must use this — never read
// process.env directly for API keys.
// ─────────────────────────────────────────────

import { db } from "@/lib/db"
import type { IntegrationSettings } from "@prisma/client"

export type IntegrationConfig = {
  // Email
  resendApiKey: string | undefined
  emailFromName: string
  emailFromDomain: string
  // Twilio
  twilioAccountSid: string | undefined
  twilioAuthToken: string | undefined
  twilioWhatsappNumber: string
  twilioSmsNumber: string | undefined
  // Social – Facebook & Instagram
  facebookAppId: string | undefined
  facebookAppSecret: string | undefined
  // Social – Twitter/X
  twitterClientId: string | undefined
  twitterClientSecret: string | undefined
  // Social – LinkedIn
  linkedinClientId: string | undefined
  linkedinClientSecret: string | undefined
  // Social – TikTok
  tiktokClientKey: string | undefined
  tiktokClientSecret: string | undefined
  // Social – YouTube
  youtubeClientId: string | undefined
  youtubeClientSecret: string | undefined
  // Canva
  canvaClientId: string | undefined
  canvaClientSecret: string | undefined
  canvaRedirectUri: string | undefined
  // AI
  anthropicApiKey: string | undefined
  // App
  appUrl: string
  cronSecret: string | undefined
}

function pick(
  dbVal: string | null | undefined,
  envKey: string
): string | undefined {
  return dbVal || process.env[envKey] || undefined
}

function pickWithDefault(
  dbVal: string | null | undefined,
  envKey: string,
  defaultVal: string
): string {
  return dbVal || process.env[envKey] || defaultVal
}

export async function getIntegrationConfig(): Promise<IntegrationConfig> {
  let row: IntegrationSettings | null = null
  try {
    row = await db.integrationSettings.findUnique({ where: { id: "singleton" } })
  } catch {
    // table may not exist yet in dev — fall back to env
  }

  return {
    resendApiKey: pick(row?.resendApiKey, "RESEND_API_KEY"),
    emailFromName: pickWithDefault(row?.emailFromName, "NEXT_PUBLIC_COMPANY_NAME", "Travel CRM"),
    emailFromDomain: pickWithDefault(row?.emailFromDomain, "NEXT_PUBLIC_APP_DOMAIN", "resend.dev"),

    twilioAccountSid: pick(row?.twilioAccountSid, "TWILIO_ACCOUNT_SID"),
    twilioAuthToken: pick(row?.twilioAuthToken, "TWILIO_AUTH_TOKEN"),
    twilioWhatsappNumber: pickWithDefault(row?.twilioWhatsappNumber, "TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886"),
    twilioSmsNumber: pick(row?.twilioSmsNumber, "TWILIO_SMS_NUMBER"),

    facebookAppId: pick(row?.facebookAppId, "FACEBOOK_APP_ID"),
    facebookAppSecret: pick(row?.facebookAppSecret, "FACEBOOK_APP_SECRET"),
    twitterClientId: pick(row?.twitterClientId, "TWITTER_CLIENT_ID"),
    twitterClientSecret: pick(row?.twitterClientSecret, "TWITTER_CLIENT_SECRET"),
    linkedinClientId: pick(row?.linkedinClientId, "LINKEDIN_CLIENT_ID"),
    linkedinClientSecret: pick(row?.linkedinClientSecret, "LINKEDIN_CLIENT_SECRET"),
    tiktokClientKey: pick(row?.tiktokClientKey, "TIKTOK_CLIENT_KEY"),
    tiktokClientSecret: pick(row?.tiktokClientSecret, "TIKTOK_CLIENT_SECRET"),
    youtubeClientId: pick(row?.youtubeClientId, "YOUTUBE_CLIENT_ID"),
    youtubeClientSecret: pick(row?.youtubeClientSecret, "YOUTUBE_CLIENT_SECRET"),

    canvaClientId: pick(row?.canvaClientId, "CANVA_CLIENT_ID"),
    canvaClientSecret: pick(row?.canvaClientSecret, "CANVA_CLIENT_SECRET"),
    canvaRedirectUri: pick(row?.canvaRedirectUri, "CANVA_REDIRECT_URI"),

    anthropicApiKey: pick(row?.anthropicApiKey, "ANTHROPIC_API_KEY"),

    appUrl: pickWithDefault(row?.appUrl, "NEXTAUTH_URL", "http://localhost:3000"),
    cronSecret: pick(row?.cronSecret, "CRON_SECRET"),
  }
}
