import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase
    .from('oauth_tokens')
    .delete()
    .eq('plataforma', 'meta')
    .eq('token_type', 'global')
  return NextResponse.json({ ok: true })
}
