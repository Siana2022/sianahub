import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken, exchangeForLongLivedToken } from '@/lib/meta/oauth'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sianahub.sianadigital.com'

  if (error || !code) {
    return NextResponse.redirect(`${base}/config?error=meta_denied`)
  }

  try {
    // Exchange code for short-lived token
    const shortToken = await exchangeCodeForToken(code)

    // Exchange for long-lived token (valid 60 days)
    const longToken = await exchangeForLongLivedToken(shortToken.access_token)

    const supabase = await createClient()

    // Delete existing and re-insert
    await supabase
      .from('oauth_tokens')
      .delete()
      .eq('plataforma', 'meta')
      .eq('token_type', 'global')

    await supabase
      .from('oauth_tokens')
      .insert({
        plataforma:    'meta',
        token_type:    'global',
        access_token:  longToken.access_token,
        refresh_token: null,
        expires_at:    new Date(Date.now() + (longToken.expires_in ?? 5184000) * 1000).toISOString(),
        scope:         'ads_read,read_insights,business_management',
        cliente_id:    null,
      })

    return NextResponse.redirect(`${base}/config?success=meta`)
  } catch (err) {
    console.error('Meta OAuth callback error:', err)
    return NextResponse.redirect(`${base}/config?error=meta_failed`)
  }
}
