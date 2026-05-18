const APP_ID     = process.env.META_APP_ID!
const APP_SECRET = process.env.META_APP_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sianahub.sianadigital.com'}/api/auth/meta/callback`

export function buildMetaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id:     APP_ID,
    redirect_uri:  REDIRECT_URI,
    scope:         'ads_read,read_insights,business_management',
    response_type: 'code',
  })
  return `https://www.facebook.com/dialog/oauth?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  token_type: string
}> {
  const params = new URLSearchParams({
    client_id:     APP_ID,
    client_secret: APP_SECRET,
    redirect_uri:  REDIRECT_URI,
    code,
  })
  const res = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${params}`)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta OAuth error: ${err}`)
  }
  return res.json()
}

export async function exchangeForLongLivedToken(shortToken: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  const params = new URLSearchParams({
    grant_type:        'fb_exchange_token',
    client_id:         APP_ID,
    client_secret:     APP_SECRET,
    fb_exchange_token: shortToken,
  })
  const res = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${params}`)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta long-lived token error: ${err}`)
  }
  return res.json()
}
