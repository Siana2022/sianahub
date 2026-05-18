'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { Loader2 } from 'lucide-react'

type DailyRow = { fecha: string; organico: number; meta: number }

interface LeadsData {
  total: number
  total_prev: number
  meta: number
  organico: number
  cpl_meta: number
  cpl_meta_prev: number
  daily: DailyRow[]
  metaError?: string
  ga4Error?: string
}

export default function LeadsPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [data,    setData]    = useState<LeadsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [metaRes, ga4Res] = await Promise.allSettled([
        fetch(`/api/clientes/${clienteId}/meta`).then(r => r.json()),
        fetch(`/api/clientes/${clienteId}/ga4/trafico`).then(r => r.json()),
      ])

      const meta = metaRes.status === 'fulfilled' && !metaRes.value.error ? metaRes.value : null
      const ga4  = ga4Res.status  === 'fulfilled' && !ga4Res.value.error  ? ga4Res.value  : null

      const metaConversions = meta?.summary?.conversions ?? 0
      const ga4Conversions  = ga4?.summary?.conversions  ?? 0
      const metaCpl         = meta?.summary?.cpl         ?? 0
      const metaCplPrev     = meta?.summary?.cpl_prev    ?? 0

      // Build daily combining GA4 + Meta by date
      const ga4Daily:  { fecha: string; conversions: number }[] = ga4?.daily  ?? []
      const metaDaily: { fecha: string; conversions: number }[] = meta?.daily ?? []

      const dateMap = new Map<string, DailyRow>()
      for (const d of ga4Daily)  dateMap.set(d.fecha, { fecha: d.fecha, organico: d.conversions, meta: 0 })
      for (const d of metaDaily) {
        const existing = dateMap.get(d.fecha)
        if (existing) existing.meta = d.conversions
        else dateMap.set(d.fecha, { fecha: d.fecha, organico: 0, meta: d.conversions })
      }
      const daily = [...dateMap.values()].sort((a, b) => a.fecha.localeCompare(b.fecha))

      setData({
        total:         metaConversions + ga4Conversions,
        total_prev:    0,
        meta:          metaConversions,
        organico:      ga4Conversions,
        cpl_meta:      metaCpl,
        cpl_meta_prev: metaCplPrev,
        daily,
        metaError: metaRes.status === 'fulfilled' && metaRes.value.error ? metaRes.value.error : undefined,
        ga4Error:  ga4Res.status  === 'fulfilled' && ga4Res.value.error  ? ga4Res.value.error  : undefined,
      })
      setLoading(false)
    }
    load()
  }, [clienteId])

  if (loading) return (
    <div className="p-8 flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-[#888888]" />
      <span className="font-mono text-[10px] text-[#888888]">Cargando leads...</span>
    </div>
  )

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#000000]">
        <h2 className="font-display text-2xl font-bold">Leads</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#888888]">últimos 30 días</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        <KpiCard label="Leads totales"  value={data!.total} />
        <KpiCard label="Meta Ads"       value={data!.meta} />
        <KpiCard label="Orgánico (GA4)" value={data!.organico} />
        <KpiCard label="CPL Meta"       value={data!.cpl_meta > 0 ? `€${data!.cpl_meta.toFixed(2)}` : '—'} prev={data!.cpl_meta_prev} invertColors />
      </div>

      {data!.daily.length > 0 && (
        <div className="bg-white border border-[#e8e8e8] p-6">
          <h3 className="font-display text-base font-bold mb-1">Evolución de leads</h3>
          <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-5">por canal — 30 días</p>
          <LineChart
            data={data!.daily}
            series={[
              { key: 'meta',     label: 'Meta Ads',       color: '#1877f2' },
              { key: 'organico', label: 'Orgánico (GA4)', color: '#1a7a4a' },
            ]}
            height={240}
            formatY={v => String(Math.round(v))}
          />
        </div>
      )}

      {(data?.metaError || data?.ga4Error) && (
        <div className="space-y-1">
          {data?.metaError && <p className="font-mono text-[9px] text-[#888888]">⚠ Meta Ads: {data.metaError}</p>}
          {data?.ga4Error  && <p className="font-mono text-[9px] text-[#888888]">⚠ GA4: {data.ga4Error}</p>}
        </div>
      )}
    </div>
  )
}
