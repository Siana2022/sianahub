'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'

type Summary = {
  clicks: number; clicks_prev: number
  impressions: number; impressions_prev: number
  ctr: number; ctr_prev: number
  position: number; position_prev: number
}
type DailyRow  = { fecha: string; gsc_clicks: number; gsc_impressions: number }
type Keyword   = { keyword: string; clicks: number; impressions: number; ctr: number; position: number }

export default function OrganicoPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [summary,  setSummary]  = useState<Summary | null>(null)
  const [daily,    setDaily]    = useState<DailyRow[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clientes/${clienteId}/gsc/organico`)
        if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
        const data = await res.json()
        setSummary(data.summary)
        setDaily(data.daily)
        setKeywords(data.keywords)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clienteId])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#1a1a18]">
        <h2 className="font-display text-2xl font-bold">SEO / Orgánico</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#9a9a8e]">últimos 28 días · Google Search Console</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        <KpiCard label="Clicks GSC"     value={summary!.clicks.toLocaleString()}      prev={summary!.clicks_prev} />
        <KpiCard label="Impresiones"    value={summary!.impressions.toLocaleString()} prev={summary!.impressions_prev} />
        <KpiCard label="CTR medio"      value={`${summary!.ctr.toFixed(2)}%`}         prev={summary!.ctr_prev} />
        <KpiCard label="Posición media" value={summary!.position.toFixed(1)}          prev={summary!.position_prev} invertColors />
      </div>

      <div className="bg-white border border-[#e2dfd8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Clicks e impresiones</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-5">evolución diaria — 28 días</p>
        <LineChart
          data={daily}
          series={[
            { key: 'gsc_clicks',      label: 'Clicks',       color: '#1a7a4a' },
            { key: 'gsc_impressions', label: 'Impresiones',  color: '#9a9a8e' },
          ]}
          height={240}
          formatY={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
        />
      </div>

      <div className="bg-white border border-[#e2dfd8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2dfd8]">
          <h3 className="font-display text-base font-bold">Top keywords</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7f5f0]">
              <th className="text-left  px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Keyword</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Clicks</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Impresiones</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">CTR</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Posición</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2dfd8]">
            {keywords.map(kw => (
              <tr key={kw.keyword} className="hover:bg-[#f7f5f0] transition-colors">
                <td className="px-6 py-2.5 text-[#1a1a18] font-medium">{kw.keyword}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18] font-medium">{kw.clicks.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#4a4a42]">{kw.impressions.toLocaleString()}</td>
                <td className="px-6 py-2.5 text-right">
                  <span className={`font-mono text-xs ${kw.ctr > 5 ? 'text-[#1a7a4a]' : 'text-[#9a9a8e]'}`}>
                    {kw.ctr.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-2.5 text-right">
                  <span className={`font-mono text-xs ${kw.position <= 5 ? 'text-[#1a7a4a]' : kw.position <= 15 ? 'text-[#d4820a]' : 'text-[#e8321a]'}`}>
                    {kw.position.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="h-8 w-48 bg-[#e2dfd8] animate-pulse" />
      <div className="grid grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white h-24 animate-pulse" />)}
      </div>
      <div className="bg-white border border-[#e2dfd8] h-72 animate-pulse" />
      <div className="bg-white border border-[#e2dfd8] h-48 animate-pulse" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-8 max-w-5xl">
      <div className="bg-[#fef0ed] border border-[#e8321a] border-l-4 border-l-[#e8321a] px-5 py-4">
        <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#e8321a] mb-1">Error cargando datos</p>
        <p className="text-sm text-[#4a4a42]">{message}</p>
      </div>
    </div>
  )
}
