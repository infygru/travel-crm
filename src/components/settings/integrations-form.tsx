"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react"
import { saveIntegrationSettings } from "@/lib/actions/integrations"
import type { IntegrationSettings } from "@prisma/client"

type Props = { settings: IntegrationSettings | null }

function SecretInput({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Enter value…"}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function TextInput({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Enter value…"}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
    />
  )
}

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Not set
    </span>
  )
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">{children}</div>}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
  configured,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  configured?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {configured !== undefined && <StatusBadge configured={configured} />}
      </div>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export function IntegrationsForm({ settings }: Props) {
  const s = settings

  // ── state ──────────────────────────────────────────────
  const [resendApiKey, setResendApiKey] = useState(s?.resendApiKey ?? "")
  const [emailFromName, setEmailFromName] = useState(s?.emailFromName ?? "")
  const [emailFromDomain, setEmailFromDomain] = useState(s?.emailFromDomain ?? "")

  const [twilioAccountSid, setTwilioAccountSid] = useState(s?.twilioAccountSid ?? "")
  const [twilioAuthToken, setTwilioAuthToken] = useState(s?.twilioAuthToken ?? "")
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState(s?.twilioWhatsappNumber ?? "")
  const [twilioSmsNumber, setTwilioSmsNumber] = useState(s?.twilioSmsNumber ?? "")

  const [facebookAppId, setFacebookAppId] = useState(s?.facebookAppId ?? "")
  const [facebookAppSecret, setFacebookAppSecret] = useState(s?.facebookAppSecret ?? "")
  const [twitterClientId, setTwitterClientId] = useState(s?.twitterClientId ?? "")
  const [twitterClientSecret, setTwitterClientSecret] = useState(s?.twitterClientSecret ?? "")
  const [linkedinClientId, setLinkedinClientId] = useState(s?.linkedinClientId ?? "")
  const [linkedinClientSecret, setLinkedinClientSecret] = useState(s?.linkedinClientSecret ?? "")
  const [tiktokClientKey, setTiktokClientKey] = useState(s?.tiktokClientKey ?? "")
  const [tiktokClientSecret, setTiktokClientSecret] = useState(s?.tiktokClientSecret ?? "")
  const [youtubeClientId, setYoutubeClientId] = useState(s?.youtubeClientId ?? "")
  const [youtubeClientSecret, setYoutubeClientSecret] = useState(s?.youtubeClientSecret ?? "")

  const [canvaClientId, setCanvaClientId] = useState(s?.canvaClientId ?? "")
  const [canvaClientSecret, setCanvaClientSecret] = useState(s?.canvaClientSecret ?? "")
  const [canvaRedirectUri, setCanvaRedirectUri] = useState(s?.canvaRedirectUri ?? "")

  const [anthropicApiKey, setAnthropicApiKey] = useState(s?.anthropicApiKey ?? "")

  const [appUrl, setAppUrl] = useState(s?.appUrl ?? "")
  const [cronSecret, setCronSecret] = useState(s?.cronSecret ?? "")

  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await saveIntegrationSettings({
        resendApiKey, emailFromName, emailFromDomain,
        twilioAccountSid, twilioAuthToken, twilioWhatsappNumber, twilioSmsNumber,
        facebookAppId, facebookAppSecret,
        twitterClientId, twitterClientSecret,
        linkedinClientId, linkedinClientSecret,
        tiktokClientKey, tiktokClientSecret,
        youtubeClientId, youtubeClientSecret,
        canvaClientId, canvaClientSecret, canvaRedirectUri,
        anthropicApiKey,
        appUrl, cronSecret,
      })
      toast.success("Integration settings saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* App */}
      <Section title="App" description="Base URL and internal secrets" defaultOpen>
        <Field label="App URL" hint="Used in email links and OAuth callbacks (e.g. https://yourapp.com)" configured={!!appUrl}>
          <TextInput name="appUrl" value={appUrl} onChange={setAppUrl} placeholder="https://yourapp.com" />
        </Field>
        <Field label="Cron Secret" hint="Secret token to protect the /api/cron/run endpoint" configured={!!cronSecret}>
          <SecretInput name="cronSecret" value={cronSecret} onChange={setCronSecret} placeholder="random-secret-string" />
        </Field>
      </Section>

      {/* Email */}
      <Section title="Email — Resend" description="Transactional emails for bookings, invites, and notifications" defaultOpen={!!resendApiKey}>
        <Field label="Resend API Key" configured={!!resendApiKey}>
          <SecretInput name="resendApiKey" value={resendApiKey} onChange={setResendApiKey} placeholder="re_..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From Name" hint="Sender display name">
            <TextInput name="emailFromName" value={emailFromName} onChange={setEmailFromName} placeholder="Travel CRM" />
          </Field>
          <Field label="From Domain" hint="Verified Resend domain">
            <TextInput name="emailFromDomain" value={emailFromDomain} onChange={setEmailFromDomain} placeholder="mail.yourapp.com" />
          </Field>
        </div>
      </Section>

      {/* Twilio */}
      <Section title="Twilio — WhatsApp & SMS" description="Send WhatsApp messages and SMS to clients" defaultOpen={!!twilioAccountSid}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Account SID" configured={!!twilioAccountSid}>
            <TextInput name="twilioAccountSid" value={twilioAccountSid} onChange={setTwilioAccountSid} placeholder="ACxxxxxxxx" />
          </Field>
          <Field label="Auth Token" configured={!!twilioAuthToken}>
            <SecretInput name="twilioAuthToken" value={twilioAuthToken} onChange={setTwilioAuthToken} placeholder="Auth token" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp Number" hint="Include whatsapp: prefix">
            <TextInput name="twilioWhatsappNumber" value={twilioWhatsappNumber} onChange={setTwilioWhatsappNumber} placeholder="whatsapp:+14155238886" />
          </Field>
          <Field label="SMS Number">
            <TextInput name="twilioSmsNumber" value={twilioSmsNumber} onChange={setTwilioSmsNumber} placeholder="+14155238886" />
          </Field>
        </div>
      </Section>

      {/* Facebook & Instagram */}
      <Section title="Facebook & Instagram" description="OAuth app for posting to Facebook Pages and Instagram Business accounts" defaultOpen={!!facebookAppId}>
        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Create an app at <strong>developers.facebook.com</strong> with the <em>Facebook Login</em> and <em>Instagram API</em> products.
          Set the OAuth redirect URI to: <code className="bg-white px-1 rounded">{appUrl || "https://yourapp.com"}/api/social/callback/facebook</code>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="App ID" configured={!!facebookAppId}>
            <TextInput name="facebookAppId" value={facebookAppId} onChange={setFacebookAppId} placeholder="1234567890" />
          </Field>
          <Field label="App Secret" configured={!!facebookAppSecret}>
            <SecretInput name="facebookAppSecret" value={facebookAppSecret} onChange={setFacebookAppSecret} placeholder="App secret" />
          </Field>
        </div>
      </Section>

      {/* Twitter / X */}
      <Section title="Twitter / X" description="Post tweets and threads via Twitter API v2" defaultOpen={!!twitterClientId}>
        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Create an OAuth 2.0 app at <strong>developer.twitter.com</strong>. Callback URL:
          <code className="bg-white px-1 rounded ml-1">{appUrl || "https://yourapp.com"}/api/social/callback/twitter</code>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client ID" configured={!!twitterClientId}>
            <TextInput name="twitterClientId" value={twitterClientId} onChange={setTwitterClientId} placeholder="Client ID" />
          </Field>
          <Field label="Client Secret" configured={!!twitterClientSecret}>
            <SecretInput name="twitterClientSecret" value={twitterClientSecret} onChange={setTwitterClientSecret} placeholder="Client secret" />
          </Field>
        </div>
      </Section>

      {/* LinkedIn */}
      <Section title="LinkedIn" description="Post to LinkedIn company pages and personal profiles" defaultOpen={!!linkedinClientId}>
        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Create an app at <strong>linkedin.com/developers</strong>. Callback URL:
          <code className="bg-white px-1 rounded ml-1">{appUrl || "https://yourapp.com"}/api/social/callback/linkedin</code>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client ID" configured={!!linkedinClientId}>
            <TextInput name="linkedinClientId" value={linkedinClientId} onChange={setLinkedinClientId} placeholder="Client ID" />
          </Field>
          <Field label="Client Secret" configured={!!linkedinClientSecret}>
            <SecretInput name="linkedinClientSecret" value={linkedinClientSecret} onChange={setLinkedinClientSecret} placeholder="Client secret" />
          </Field>
        </div>
      </Section>

      {/* TikTok */}
      <Section title="TikTok" description="Publish videos and image posts to TikTok" defaultOpen={!!tiktokClientKey}>
        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Register at <strong>developers.tiktok.com</strong>. Callback URL:
          <code className="bg-white px-1 rounded ml-1">{appUrl || "https://yourapp.com"}/api/social/callback/tiktok</code>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client Key" configured={!!tiktokClientKey}>
            <TextInput name="tiktokClientKey" value={tiktokClientKey} onChange={setTiktokClientKey} placeholder="Client key" />
          </Field>
          <Field label="Client Secret" configured={!!tiktokClientSecret}>
            <SecretInput name="tiktokClientSecret" value={tiktokClientSecret} onChange={setTiktokClientSecret} placeholder="Client secret" />
          </Field>
        </div>
      </Section>

      {/* YouTube */}
      <Section title="YouTube" description="Upload videos and Shorts to YouTube channels" defaultOpen={!!youtubeClientId}>
        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Create OAuth 2.0 credentials at <strong>console.cloud.google.com</strong> (YouTube Data API v3). Callback URL:
          <code className="bg-white px-1 rounded ml-1">{appUrl || "https://yourapp.com"}/api/social/callback/youtube</code>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client ID" configured={!!youtubeClientId}>
            <TextInput name="youtubeClientId" value={youtubeClientId} onChange={setYoutubeClientId} placeholder="xxx.apps.googleusercontent.com" />
          </Field>
          <Field label="Client Secret" configured={!!youtubeClientSecret}>
            <SecretInput name="youtubeClientSecret" value={youtubeClientSecret} onChange={setYoutubeClientSecret} placeholder="Client secret" />
          </Field>
        </div>
      </Section>

      {/* Canva */}
      <Section title="Canva" description="Design and autofill poster templates from Canva brand kits" defaultOpen={!!canvaClientId}>
        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Create an app at <strong>canva.com/developers</strong> and enable the Connect API.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client ID" configured={!!canvaClientId}>
            <TextInput name="canvaClientId" value={canvaClientId} onChange={setCanvaClientId} placeholder="OAuthClientId..." />
          </Field>
          <Field label="Client Secret" configured={!!canvaClientSecret}>
            <SecretInput name="canvaClientSecret" value={canvaClientSecret} onChange={setCanvaClientSecret} placeholder="Client secret" />
          </Field>
        </div>
        <Field label="Redirect URI" hint="Must match exactly what is registered in Canva developer portal">
          <TextInput name="canvaRedirectUri" value={canvaRedirectUri} onChange={setCanvaRedirectUri} placeholder={`${appUrl || "https://yourapp.com"}/api/canva/callback`} />
        </Field>
      </Section>

      {/* AI */}
      <Section title="AI — Anthropic Claude" description="Used for AI itinerary copywriting and smart content suggestions" defaultOpen={!!anthropicApiKey}>
        <Field label="API Key" configured={!!anthropicApiKey}>
          <SecretInput name="anthropicApiKey" value={anthropicApiKey} onChange={setAnthropicApiKey} placeholder="sk-ant-..." />
        </Field>
      </Section>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save all settings"}
        </button>
      </div>
    </div>
  )
}
