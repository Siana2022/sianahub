export interface SnippetValidationResult {
  gtm_id_found: string | null
  sgtm_url_found: string | null
  gtm_id_matches: boolean | null
  sgtm_url_matches: boolean | null
  error: string | null
}

export interface HealthCheckResult {
  healthy: boolean
  status: number
  error?: string
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
        gtm_id_matches: null,
        sgtm_url_matches: null,
        error: `HTTP ${res.status} al obtener ${url}`,
      }
    }

    const html = await res.text()

    // Match GTM container ID pattern
    const gtmMatch = html.match(/GTM-[A-Z0-9]+/)
    const gtm_id_found = gtmMatch ? gtmMatch[0] : null

    // Match sGTM URL — e.g. https://t.example.com/gtm.js — capture without /gtm.js
    const sgtmMatch = html.match(/https:\/\/[a-z0-9.\-/]+\/gtm\.js/)
    let sgtm_url_found: string | null = null
    if (sgtmMatch) {
      sgtm_url_found = sgtmMatch[0].replace(/\/gtm\.js$/, '')
    }

    const gtm_id_matches = expectedGtmId != null ? gtm_id_found === expectedGtmId : null
    const sgtm_url_matches = expectedSgtmUrl != null ? sgtm_url_found === expectedSgtmUrl : null

    return {
      gtm_id_found,
      sgtm_url_found,
      gtm_id_matches,
      sgtm_url_matches,
      error: null,
    }
  } catch (err: unknown) {
    return {
      gtm_id_found: null,
      sgtm_url_found: null,
      gtm_id_matches: null,
      sgtm_url_matches: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    }
  }
}

export async function checkSgtmHealth(sgtmUrl: string): Promise<HealthCheckResult> {
  try {
    const res = await fetch(`${sgtmUrl}/healthz`, {
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
