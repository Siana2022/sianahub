'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { RefreshCw, ExternalLink } from 'lucide-react'

interface SgtmRow {
  key:        string
  label:      string
  url:        string | null
  count:      number
  count_prev: number
  pct:        number
}

function prevMonth() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastPrev = new Date(first.getTime() - 1)
  const firstPrev = new Date(lastPrev.getFullYear(), lastPrev.getMonth(), 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { desde: fmt(firstPrev), hasta: fmt(lastPrev) }
}

function deltaPct(curr: number, prev: number): number | null {
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}

export default function SgtmPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [rows,    setRows]    = useState<SgtmRow[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [desde,   setDesde]   = useState(() => prevMonth().desde)
  const [hasta,   setHasta]   = useState(() => prevMonth().hasta)

  const fetchData = useCallback(async (d: string, h: string) => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/clientes/${clienteId}/sgtm?desde=${d}&hasta=${h}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRows(json.rows ?? [])
      setTotal(json.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => { fetchData(desde, hasta) }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const inputCls = "font-mono text-[10px] border border-[#e8e8e8] px-2 py-1.5 focus:outline-none focus:border-[#000000] transition-colors"

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#000000]">
        <div>
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-1">Informe por periodo</p>
          <h2 className="font-display text-2xl font-bold">sGTM — Leads por equipo</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wide text-[#888888]">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-center gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wide text-[#888888]">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={inputCls} />
          </div>
          <button
            onClick={() => fetchData(desde, hasta)}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide bg-[#F7415C] text-white px-3 py-2 hover:bg-[#000000] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#fff0f2] border border-[#F7415C] border-l-4 border-l-[#F7415C] px-5 py-4">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#F7415C] mb-1">Error cargando datos</p>
          <p className="text-sm text-[#555555]">{error}</p>
          {error.includes('configured') && (
            <p className="mt-2 font-mono text-[9px] text-[#888888]">
              Configura los eventos sGTM en Editar cliente → sección sGTM.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#e8e8e8] animate-pulse" />
          ))}
        </div>
      ) : !error && rows.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] px-6 py-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-2">Sin eventos configurados</p>
          <p className="font-mono text-xs text-[#bbbbbb]">
            Ve a Editar cliente → sección sGTM → añade los eventos a monitorizar.
          </p>
        </div>
      ) : !error && rows.length > 0 ? (
        <div className="bg-white border border-[#e8e8e8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8e8e8] flex items-baseline justify-between">
            <h3 className="font-display text-base font-bold">Leads por equipo / producto</h3>
            <span className="font-mono text-[9px] text-[#888888] uppercase tracking-wide">{desde} → {hasta}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e8e8e8]">
                {['Equipo', 'Página de gracias', 'Leads', 'vs periodo ant.', '% del total'].map(h => (
                  <th key={h} className="px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8e8]">
              {rows.map(row => {
                const delta = deltaPct(row.count, row.count_prev)
                const isPos = delta !== null && delta > 0
                const isNeg = delta !== null && delta < 0
                return (
                  <tr key={row.key} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-6 py-3 font-medium text-[#000000]">{row.label}</td>
                    <td className="px-6 py-3">
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] text-[#888888] hover:text-[#000000] flex items-center gap-1 transition-colors"
                        >
                          {row.url.replace(/^https?:\/\/[^/]+/, '')}
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="font-mono text-[10px] text-[#cccccc]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-mono text-sm font-bold">{row.count.toLocaleString('es-ES')}</td>
                    <td className="px-6 py-3">
                      {delta !== null ? (
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                          isPos ? 'bg-[#edfaf2] text-[#1a7a4a]' :
                          isNeg ? 'bg-[#fff0f2] text-[#F7415C]' :
                          'bg-[#fef8ed] text-[#d4820a]'
                        }`}>
                          {isPos ? '▲' : isNeg ? '▼' : '—'} {Math.abs(delta).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#cccccc]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#000000] rounded-full"
                            style={{ width: `${Math.min(row.pct, 100).toFixed(1)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[#555555]">{row.pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#fafafa] border-t-2 border-[#000000]">
                <td className="px-6 py-3 font-mono text-[10px] uppercase tracking-wide font-bold">Total</td>
                <td />
                <td className="px-6 py-3 font-mono text-sm font-bold">{total.toLocaleString('es-ES')}</td>
                <td />
                <td className="px-6 py-3 font-mono text-[10px] text-[#888888]">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </div>
  )
}
