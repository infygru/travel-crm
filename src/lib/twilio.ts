import twilio from "twilio"
import crypto from "crypto"
import { getIntegrationConfig } from "@/lib/config"

export async function getTwilioClient() {
  const cfg = await getIntegrationConfig()
  if (!cfg.twilioAccountSid || !cfg.twilioAuthToken) {
    throw new Error("Twilio credentials not configured. Go to Settings → Integrations to add them.")
  }
  return twilio(cfg.twilioAccountSid, cfg.twilioAuthToken)
}

export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  const client = await getTwilioClient()
  const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`
  const message = await client.messages.create({
    from: cfg.twilioWhatsappNumber,
    to: toNumber,
    body,
  })
  return message.sid
}

export async function sendSMS(to: string, body: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.twilioSmsNumber) throw new Error("Twilio SMS number not configured.")
  const client = await getTwilioClient()
  const message = await client.messages.create({
    from: cfg.twilioSmsNumber,
    to,
    body,
  })
  return message.sid
}

export async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): Promise<boolean> {
  const cfg = await getIntegrationConfig()
  if (!cfg.twilioAuthToken) return false

  const sortedKeys = Object.keys(params).sort()
  let dataStr = url
  for (const key of sortedKeys) {
    dataStr += key + params[key]
  }

  const expected = crypto
    .createHmac("sha1", cfg.twilioAuthToken)
    .update(dataStr)
    .digest("base64")

  return expected === signature
}
