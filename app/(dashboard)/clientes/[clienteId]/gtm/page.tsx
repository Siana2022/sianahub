'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface SnippetResult {
  gtm_id_found: string | null
  sgtm_url_found: string | null
  gtm_id_matches: boolean | null
  sgtm_url_matches: boolean | null
  error: string | null
}

interface HealthResult {
  healthy: boolean
  status: number
  error?: string
}

interface CheckResult {
  snippet: SnippetResult
  health: HealthResult
  alerts_created: string[]
}

interface ClienteConfig {
  gtm_container_id: string | null
  sgtm_url: string | null
  sgtm_service_name: string | null
  gcp_project_id: string | null
}

function StatusIcon({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="text-[#888888] text-sm">—</span>
  return ok ? (
    <CheckCircle className="w-4 h-4 text-[#1a7a4a]" />
  ) : (
    <XCircle className="w-4 h-4 text-[#F7415C]" />
  )
}

function ConfigField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="py-3 border-b border-[#e8e8e8] last:border-b-0">
      <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-1">{label}</p>
      <p className="text-sm text-[#000000] font-mono">
        {value ?? <span className="text-[#888888]">No configurado</span>}
      </p>
    </div>
  )
}

export default function ClienteGtmPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [config, setConfig] = useState<ClienteConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  // Load config once
  useState(() => {
    fetch(`/api/clientes/${clienteId}`)
      .then(r => r.json())
      .then(data => {
        setConfig({
          gtm_container_id: data.gtm_container_id ?? null,
          sgtm_url: data.sgtm_url ?? null,
          sgtm_service_name: data.sgtm_service_name ?? null,
          gcp_project_id: data.gcp_project_id ?? null,
        })
      })
      .catch(() => setConfig(null))
      .finally(() => setConfigLoading(false))
  })

  async function runCheck() {
    setChecking(true)
    setCheckError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/clientes/${clienteId}/sgtm/check`)
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error ?? 'Error en la verificación')
      }
      const data = await res.json()
      setResult(data)
    } catch (e: unknown) {
      setCheckError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#000000]">
        <h2 className="font-display text-2xl font-bold">GTM + sGTM</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#888888]">
          monitorización
        </span>
      </div>

      {/* sGTM Health Check */}
      <div className="bg-white border border-[#e8e8e8] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-base font-bold">Verificación sGTM</h3>
            <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mt-0.5">
              snippet en sitio + salud del servidor
            </p>
          </div>
          <button
            onClick={runCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-[#000000] text-white font-mono text-[9px] tracking-[2px] uppercase hover:bg-[#F7415C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checking && <Loader2 className="w-3 h-3 animate-spin" />}
            Verificar ahora
          </button>
        </div>

        {checkError && (
          <div className="border border-[#F7415C]/30 bg-[#F7415C]/5 p-4">
            <p className="font-mono text-[10px] text-[#F7415C]">{checkError}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Snippet check */}
            <div className="border border-[#e8e8e8] p-4 space-y-3">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">
                Snippet en sitio
              </p>
              {result.snippet.error ? (
                <p className="font-mono text-[10px] text-[#F7415C]">{result.snippet.error}</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <StatusIcon ok={result.snippet.gtm_id_found !== null} />
                    <span className="font-mono text-[10px] text-[#555555]">
                      GTM ID detectado
                      {result.snippet.gtm_id_found && (
                        <span className="ml-2 text-[#000000] font-bold">
                          {result.snippet.gtm_id_found}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusIcon ok={result.snippet.gtm_id_matches} />
                    <span className="font-mono text-[10px] text-[#555555]">
                      GTM ID coincide con config
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusIcon ok={result.snippet.sgtm_url_found !== null} />
                    <span className="font-mono text-[10px] text-[#555555]">
                      URL sGTM detectada
                      {result.snippet.sgtm_url_found && (
                        <span className="ml-2 text-[#000000] font-medium break-all">
                          {result.snippet.sgtm_url_found}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusIcon ok={result.snippet.sgtm_url_matches} />
                    <span className="font-mono text-[10px] text-[#555555]">
                      URL sGTM coincide con config
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Health check */}
            <div className="border border-[#e8e8e8] p-4 space-y-3">
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">
                Salud del servidor sGTM
              </p>
              {result.health.error && result.health.status === 0 ? (
                <p className="font-mono text-[10px] text-[#F7415C]">{result.health.error}</p>
              ) : (
                <div className="flex items-center gap-3">
                  <StatusIcon ok={result.health.healthy} />
                  <span className="font-mono text-[10px] text-[#555555]">
                    /healthz responde
                    {result.health.status > 0 && (
                      <span
                        className={`ml-2 font-bold ${
                          result.health.healthy ? 'text-[#1a7a4a]' : 'text-[#F7415C]'
                        }`}
                      >
                        HTTP {result.health.status}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Alerts created */}
            {result.alerts_created.length > 0 && (
              <div className="border border-[#f5c842]/40 bg-[#f5c842]/5 p-4">
                <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#d4820a] mb-1">
                  Alertas generadas
                </p>
                <p className="font-mono text-[10px] text-[#555555]">
                  Se crearon {result.alerts_created.length} alerta
                  {result.alerts_created.length > 1 ? 's' : ''} en el centro de alertas.
                </p>
              </div>
            )}

            {result.alerts_created.length === 0 &&
              !result.snippet.error &&
              result.health.healthy && (
                <div className="border border-[#1a7a4a]/30 bg-[#1a7a4a]/5 p-4">
                  <p className="font-mono text-[10px] text-[#1a7a4a]">
                    Todo correcto. No se generaron alertas.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Configuración */}
      <div className="bg-white border border-[#e8e8e8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Configuración</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-4">
          parámetros del cliente
        </p>

        {configLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-3 h-3 animate-spin text-[#888888]" />
            <span className="font-mono text-[10px] text-[#888888]">Cargando...</span>
          </div>
        ) : (
          <div>
            <ConfigField label="GTM Container ID" value={config?.gtm_container_id ?? null} />
            <ConfigField label="sGTM URL" value={config?.sgtm_url ?? null} />
            <ConfigField label="sGTM Service Name" value={config?.sgtm_service_name ?? null} />
            <ConfigField label="GCP Project ID" value={config?.gcp_project_id ?? null} />
          </div>
        )}
      </div>
    </div>
  )
}
