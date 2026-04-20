import twilio from "twilio";
import crypto from "crypto";

const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886";
const smsNumber = process.env.TWILIO_SMS_NUMBER ?? "";

export function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const client = getTwilioClient();
  const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const message = await client.messages.create({
    from: whatsappNumber,
    to: toNumber,
    body,
  });
  return message.sid;
}

export async function sendSMS(to: string, body: string): Promise<string> {
  const client = getTwilioClient();
  const message = await client.messages.create({
    from: smsNumber,
    to,
    body,
  });
  return message.sid;
}

export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!authToken) return false;

  // Sort params alphabetically and concatenate to URL
  const sortedKeys = Object.keys(params).sort();
  let dataStr = url;
  for (const key of sortedKeys) {
    dataStr += key + params[key];
  }

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(dataStr)
    .digest("base64");

  return expected === signature;
}
