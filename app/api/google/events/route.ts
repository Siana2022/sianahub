import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchGA4AllEvents } from '@/lib/google/ga4'

export async function GET(req: NextRequest) {
  const propertyId = req.nextUrl.searchParams.get('property_id')
  if (!propertyId) {
    return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })
  }

  const fullId = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`

  try {
    const events = await fetchGA4AllEvents(fullId)
    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
