// Canva Connect API client
const CANVA_API_BASE = "https://api.canva.com/rest/v1"

export async function getCanvaAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.CANVA_CLIENT_ID!,
    redirect_uri: process.env.CANVA_REDIRECT_URI!,
    response_type: "code",
    scope: "design:content:read design:content:write design:meta:read",
    state,
  })
  return `https://www.canva.com/api/oauth/authorize?${params.toString()}`
}

export async function exchangeCanvaCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.CANVA_REDIRECT_URI!,
      client_id: process.env.CANVA_CLIENT_ID!,
      client_secret: process.env.CANVA_CLIENT_SECRET!,
    }),
  })
  return res.json()
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
    body: JSON.stringify({ title, design_type: { type: designType } }),
  })
  return res.json()
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
