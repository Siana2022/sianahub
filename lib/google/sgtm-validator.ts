export interface SnippetValidationResult {
  // First found (backward compat)
  gtm_id_found: string | null
  sgtm_url_found: string | null
  gtm_id_matches: boolean | null
  sgtm_url_matches: boolean | null
  // All found (for cross-contamination detection)
  gtm_ids_found: string[]
  sgtm_urls_found: string[]
  error: string | null
}

export interface HealthCheckResult {
  healthy: boolean
  status: number
  error?: string
}

export interface ContaminacionItem {
  tipo: 'gtm_id' | 'sgtm_url'
  valor: string
  cliente_nombre: string
  cliente_id: string
}

export interface ContaminacionResult {
  contaminado: boolean
  items: ContaminacionItem[]
}

export async function validateClientSnippet(
  dominio: string,
  expectedGtmId: string | null,
  expectedSgtmUrl: string | null
): Promise<SnippetValidationResult> {
  try {
    const url = dominio.startsWith('http') ? dominio : `https://${dominio}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SianaBot/1.0' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return {
        gtm_id_found: null,
        sgtm_url_found: null,
        gtm_ids_found: [],
        sgtm_urls_found: [],
        gtm_id_matches: null,
        sgtm_url_matches: null,
        error: `HTTP ${res.status} al obtener ${url}`,
      }
    }

    const html = await res.text()

    // Find ALL GTM container IDs in the page
    const gtmMatches = [...html.matchAll(/GTM-[A-Z0-9]+/g)]
    const gtm_ids_found = [...new Set(gtmMatches.map(m => m[0]))]
    const gtm_id_found = gtm_ids_found[0] ?? null

    // Find ALL sGTM URLs in the page (capture base URL without /gtm.js)
    const sgtmMatches = [...html.matchAll(/https:\/\/[a-zA-Z0-9.\-]+\/gtm\.js/g)]
    const sgtm_urls_found = [...new Set(
      sgtmMatches.map(m => m[0].replace(/\/gtm\.js$/, ''))
    )]
    const sgtm_url_found = sgtm_urls_found[0] ?? null

    const gtm_id_matches = expectedGtmId != null ? gtm_ids_found.includes(expectedGtmId) : null
    const sgtm_url_matches = expectedSgtmUrl != null ? sgtm_urls_found.includes(expectedSgtmUrl) : null

    return {
      gtm_id_found,
      sgtm_url_found,
      gtm_ids_found,
      sgtm_urls_found,
      gtm_id_matches,
      sgtm_url_matches,
      error: null,
    }
  } catch (err: unknown) {
    return {
      gtm_id_found: null,
      sgtm_url_found: null,
      gtm_ids_found: [],
      sgtm_urls_found: [],
      gtm_id_matches: null,
      sgtm_url_matches: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    }
  }
}

export async function checkSgtmHealth(sgtmUrl: string, gtmId?: string | null): Promise<HealthCheckResult> {
  const testUrl = gtmId
    ? `${sgtmUrl}/gtm.js?id=${gtmId}`
    : `${sgtmUrl}/gtm.js`

  try {
    const res = await fetch(testUrl, {
      signal: AbortSignal.timeout(5000),
    })
    return { healthy: res.ok, status: res.status }
  } catch (err: unknown) {
    return {
      healthy: false,
      status: 0,
      error: err instanceof Error ? err.message : 'Error desconocido',
    }
  }
}
