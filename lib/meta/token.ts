import { createClient } from '@/lib/supabase/server'

export async function getMetaToken(): Promise<string> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('oauth_tokens')
    .select('access_token, expires_at')
    .eq('plataforma', 'meta')
    .eq('token_type', 'global')
    .single()

  if (error || !row) {
    throw new Error('Meta Ads no está conectado. Ve a Configuración y conecta tu cuenta.')
  }

  // Long-lived tokens last 60 days — warn if within 7 days of expiry but still use them
  // (no refresh_token for Meta user tokens — user must re-auth when expired)
  return row.access_token
}
