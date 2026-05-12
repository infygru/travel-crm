// Canva Connect API client
import { getIntegrationConfig } from "@/lib/config"

const CANVA_API_BASE = "https://api.canva.com/rest/v1"

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString("base64url")
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Buffer.from(digest).toString("base64url")
}

export async function getCanvaAuthUrl(state: string, codeChallenge: string): Promise<string> {
  const cfg = await getIntegrationConfig()
  if (!cfg.canvaClientId || !cfg.canvaRedirectUri) {
    throw new Error("Canva credentials not configured. Go to Settings → Integrations.")
  }
  const params = new URLSearchParams({
    client_id: cfg.canvaClientId,
    redirect_uri: cfg.canvaRedirectUri,
    response_type: "code",
    scope: "design:content:read design:content:write design:meta:read brandtemplate:meta:read brandtemplate:content:read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })
  return `https://www.canva.com/api/oauth/authorize?${params.toString()}`
}

export async function exchangeCanvaCode(code: string, codeVerifier: string): Promise<{ access_token: string; refresh_token: string }> {
  const cfg = await getIntegrationConfig()
  if (!cfg.canvaClientId || !cfg.canvaClientSecret || !cfg.canvaRedirectUri) {
    throw new Error("Canva credentials not configured. Go to Settings → Integrations.")
  }
  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: cfg.canvaRedirectUri,
      client_id: cfg.canvaClientId,
      client_secret: cfg.canvaClientSecret,
      code_verifier: codeVerifier,
    }),
  })
  return res.json()
}

export async function autofillCanvaTemplate(
  accessToken: string,
  brandTemplateId: string,
  title: string,
  fields: Record<string, string>
): Promise<{ job: { id: string; status: string; result?: { design: { id: string; urls: { edit_url: string; view_url: string } } } } }> {
  const data: Record<string, { type: string; text: string }> = {}
  for (const [key, value] of Object.entries(fields)) {
    data[key] = { type: "text", text: value }
  }
  const res = await fetch(`${CANVA_API_BASE}/autofills`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ brand_template_id: brandTemplateId, title, data }),
  })
  const json = await res.json()
  if (!res.ok) console.error("[Canva] autofill error:", res.status, JSON.stringify(json))
  return json
}

export async function getAutofillJob(
  accessToken: string,
  jobId: string
): Promise<{ job: { id: string; status: string; result?: { design: { id: string; urls: { edit_url: string; view_url: string } } } } }> {
  const res = await fetch(`${CANVA_API_BASE}/autofills/${jobId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

export async function listBrandTemplates(
  accessToken: string
): Promise<{ items: { id: string; title: string; thumbnail?: { url: string } }[] }> {
  const res = await fetch(`${CANVA_API_BASE}/brand-templates?ownership=any&limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

function getCanvaDesignType(designType: string) {
  switch (designType.toUpperCase()) {
    case "PRESENTATION": return { type: "preset", name: "presentation" }
    case "POSTER":       return { type: "custom", width: 1080, height: 1530, unit: "px" }
    case "FLYER":        return { type: "custom", width: 1080, height: 1080, unit: "px" }
    default:             return { type: "preset", name: "doc" }
  }
}

export async function createCanvaDesign(
  accessToken: string,
  title: string,
  designType = "POSTER"
): Promise<{ design: { id: string; urls: { edit_url: string } } }> {
  const res = await fetch(`${CANVA_API_BASE}/designs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, design_type: getCanvaDesignType(designType) }),
  })
  const data = await res.json()
  if (!res.ok) console.error("[Canva] createDesign failed:", res.status, JSON.stringify(data))
  return data
}

export async function getCanvaDesign(accessToken: string, designId: string) {
  const res = await fetch(`${CANVA_API_BASE}/designs/${designId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

export async function exportCanvaDesign(accessToken: string, designId: string, format = "PNG") {
  const res = await fetch(`${CANVA_API_BASE}/exports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ design_id: designId, format }),
  })
  return res.json()
}
