import { NextResponse } from 'next/server'
import { buildMetaAuthUrl } from '@/lib/meta/oauth'

export async function GET() {
  const url = buildMetaAuthUrl()
  return NextResponse.redirect(url)
}
