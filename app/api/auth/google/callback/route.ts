import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/google/oauth'

// GET /api/auth/google/callback
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sianahub.vercel.app'

  if (error || !code) {
    return NextResponse.redirect(`${base}/config?error=google_denied`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const supabase = await createClient()

    // Delete existing global token and re-insert (partial index incompatible with upsert)
    await supabase
      .from('oauth_tokens')
      .delete()
      .eq('plataforma', 'google')
      .eq('token_type', 'global')

    await supabase
      .from('oauth_tokens')
      .insert({
        plataforma:    'google',
        token_type:    'global',
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at:    new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scope:         tokens.scope,
        cliente_id:    null,
      })

    return NextResponse.redirect(`${base}/config?success=google`)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(`${base}/config?error=google_failed`)
  }
}
