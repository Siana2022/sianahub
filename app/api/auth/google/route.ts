import { NextResponse } from 'next/server'
import { buildGoogleAuthUrl } from '@/lib/google/oauth'

// GET /api/auth/google — inicia el flujo OAuth2
export async function GET() {
  const url = buildGoogleAuthUrl()
  return NextResponse.redirect(url)
}
