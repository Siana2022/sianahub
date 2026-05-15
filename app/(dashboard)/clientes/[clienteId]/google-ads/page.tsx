'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'

type Summary = {
  spend: number; spend_prev: number
  clicks: number; impressions: number
  conversions: number; conversions_prev: number
  ctr: number; cpc: number; cpl: number; cpl_prev: number
}
type Campaign = {
  nombre: string; estado: string
  spend: number; clicks: number; impressions: number
  conversions: number; ctr: number; cpc: number; cpl: number
}
type DailyRow = { fecha: string; spend: number; conversions: number }

export default function GoogleAdsPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [summary,   setSummary]   = useState<Summary | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [daily,     setDaily]     = useState<DailyRow[]>([])
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clientes/${clienteId}/gads`)
        if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
        const data = await res.json()
        setSummary(data.summary)
        setCampaigns(data.campaigns)
        setDaily(data.daily)
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
    <div className="p-8 space-y-8">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#000000]">
        <h2 className="font-display text-2xl font-bold">Google Ads</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#888888]">últimos 30 días</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        <KpiCard label="Inversión"    value={`€${summary!.spend.toFixed(0)}`}       prev={summary!.spend_prev} />
        <KpiCard label="Conversiones" value={summary!.conversions}                   prev={summary!.conversions_prev} />
        <KpiCard label="CPL"          value={`€${summary!.cpl.toFixed(2)}`}         prev={summary!.cpl_prev} invertColors />
        <KpiCard label="CTR"          value={`${summary!.ctr.toFixed(2)}%`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        <KpiCard label="Clicks"      value={summary!.clicks.toLocaleString()} />
        <KpiCard label="Impresiones" value={`${(summary!.impressions / 1000).toFixed(1)}k`} />
        <KpiCard label="CPC medio"   value={`€${summary!.cpc.toFixed(2)}`} invertColors />
        <KpiCard label="Campañas"    value={campaigns.filter(c => c.estado === 'ENABLED').length} />
      </div>

      <div className="bg-white border border-[#e8e8e8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Inversión y conversiones</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-5">evolución diaria — 30 días</p>
        <LineChart
          data={daily}
          series={[
            { key: 'spend',       label: 'Inversión (€)',  color: '#1a4fa0' },
            { key: 'conversions', label: 'Conversiones',   color: '#1a7a4a' },
          ]}
          height={240}
          formatY={v => `€${v.toFixed(0)}`}
        />
      </div>

      <div className="bg-white border border-[#e8e8e8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8e8e8]">
          <h3 className="font-display text-base font-bold">Campañas</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#ffffff]">
              <th className="text-left  px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Campaña</th>
              <th className="text-left  px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Estado</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Inversión</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Clicks</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Conv.</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">CPL</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e8e8]">
            {campaigns.map(c => (
              <tr key={c.nombre} className="hover:bg-[#f9f9f9] transition-colors">
                <td className="px-6 py-2.5 text-[#000000] font-medium max-w-xs truncate">{c.nombre}</td>
                <td className="px-6 py-2.5">
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 tracking-wide uppercase ${
                    c.estado === 'ENABLED' ? 'bg-[#edfaf2] text-[#1a7a4a]' : 'bg-[#f5f5f5] text-[#888888]'
                  }`}>
                    {c.estado === 'ENABLED' ? 'Activa' : 'Pausada'}
                  </span>
                </td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#000000] font-medium">€{c.spend.toFixed(0)}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#555555]">{c.clicks.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#000000]">{c.conversions}</td>
                <td className="px-6 py-2.5 text-right">
                  <span className={`font-mono text-xs ${c.cpl < 20 ? 'text-[#1a7a4a]' : c.cpl < 50 ? 'text-[#d4820a]' : 'text-[#F7415C]'}`}>
                    {c.cpl > 0 ? `€${c.cpl.toFixed(2)}` : '—'}
                  </span>
                </td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#555555]">{c.ctr.toFixed(2)}%</td>
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
    <div className="p-8 space-y-8">
      <div className="h-8 w-48 bg-[#e8e8e8] animate-pulse" />
      <div className="grid grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white h-24 animate-pulse" />)}
      </div>
      <div className="bg-white border border-[#e8e8e8] h-64 animate-pulse" />
      <div className="bg-white border border-[#e8e8e8] h-48 animate-pulse" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-8">
      <div className="bg-[#fff0f2] border border-[#F7415C] border-l-4 border-l-[#F7415C] px-5 py-4">
        <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#F7415C] mb-1">Error cargando datos</p>
        <p className="text-sm text-[#555555]">{message}</p>
      </div>
    </div>
  )
}
