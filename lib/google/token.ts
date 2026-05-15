// Gets a valid access token, refreshing if expired
import { createClient } from '@/lib/supabase/server'
import { refreshAccessToken } from './oauth'

export async function getGlobalGoogleToken(): Promise<string> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('plataforma', 'google')
    .eq('token_type', 'global')
    .single()

  if (error || !row) throw new Error('Google no está conectado. Ve a Configuración y conecta tu cuenta.')

  const expiresAt = row.expires_at ? new Date(row.expires_at) : null
  const needsRefresh = !expiresAt || expiresAt <= new Date(Date.now() + 60_000)

  if (!needsRefresh) return row.access_token

  if (!row.refresh_token) throw new Error('No hay refresh token. Vuelve a conectar Google en Configuración.')

  const refreshed = await refreshAccessToken(row.refresh_token)

  await supabase
    .from('oauth_tokens')
    .update({
      access_token: refreshed.access_token,
      expires_at:   new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq('plataforma', 'google')
    .eq('token_type', 'global')

  return refreshed.access_token
}
