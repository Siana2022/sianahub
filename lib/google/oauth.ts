// Google OAuth2 helpers

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/adwords',
  'openid',
  'email',
].join(' ')

export function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sianahub.vercel.app'
  return `${base}/api/auth/google/callback`
}

export function buildGoogleAuthUrl(state?: string) {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  getRedirectUri(),
    response_type: 'code',
    scope:         GOOGLE_SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    ...(state ? { state } : {}),
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  getRedirectUri(),
      grant_type:    'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return res.json() as Promise<{
    access_token:  string
    refresh_token: string
    expires_in:    number
    scope:         string
    token_type:    string
  }>
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}
