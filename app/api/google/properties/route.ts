import { NextResponse } from 'next/server'
import { getGlobalGoogleToken } from '@/lib/google/token'

// Lists all GA4 properties + GSC sites the connected account can access
export async function GET() {
  try {
    const token = await getGlobalGoogleToken()

    const [ga4Res, gscRes] = await Promise.all([
      // GA4: list all account summaries (accounts + properties)
      fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      // GSC: list all verified sites
      fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    const [ga4Data, gscData] = await Promise.all([ga4Res.json(), gscRes.json()])

    // Flatten GA4 accounts → properties
    let ga4Properties: { id: string; name: string; account: string }[] = []
    let ga4Error: string | null = null

    if (!ga4Res.ok) {
      ga4Error = ga4Data.error?.message ?? ga4Data.error ?? 'Error cargando propiedades GA4'
      console.error('GA4 Admin API error:', JSON.stringify(ga4Data))
    } else {
      ga4Properties = (ga4Data.accountSummaries ?? []).flatMap((account: {
        displayName: string
        propertySummaries?: { property: string; displayName: string }[]
      }) =>
        (account.propertySummaries ?? []).map((prop) => ({
          id:      prop.property,
          name:    prop.displayName,
          account: account.displayName,
        }))
      )
    }

    // GSC sites
    const gscSites = (gscData.siteEntry ?? []).map((site: {
      siteUrl: string
      permissionLevel: string
    }) => ({
      url:        site.siteUrl,
      permission: site.permissionLevel,
    }))

    return NextResponse.json({ ga4Properties, ga4Error, gscSites })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
