'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'

type Summary = {
  sessions: number; sessions_prev: number
  users: number; users_prev: number
  bounce_rate: number; avg_session_duration: number
}
type DailyRow = { fecha: string; sessions: number; users: number; new_users: number }
type Page     = { page_path: string; sessions: number; users: number; conversions: number; conversion_rate: number }

export default function TraficoPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [daily,   setDaily]   = useState<DailyRow[]>([])
  const [pages,   setPages]   = useState<Page[]>([])
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clientes/${clienteId}/ga4/trafico`)
        if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
        const data = await res.json()
        setSummary(data.summary)
        setDaily(data.daily)
        setPages(data.pages)
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
        <h2 className="font-display text-2xl font-bold">Tráfico web</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#9a9a8e]">últimos 30 días · GA4</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        <KpiCard label="Sesiones"       value={summary!.sessions}  prev={summary!.sessions_prev} />
        <KpiCard label="Usuarios"       value={summary!.users}     prev={summary!.users_prev} />
        <KpiCard label="Tasa rebote"    value={`${summary!.bounce_rate.toFixed(1)}%`} invertColors />
        <KpiCard label="Duración media" value={`${Math.round(summary!.avg_session_duration)}s`} />
      </div>

      <div className="bg-white border border-[#e2dfd8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Sesiones y usuarios</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-5">evolución diaria — 30 días</p>
        <LineChart
          data={daily}
          series={[
            { key: 'sessions',  label: 'Sesiones', color: '#1a4fa0' },
            { key: 'users',     label: 'Usuarios', color: '#1a7a4a' },
            { key: 'new_users', label: 'Nuevos',   color: '#d4820a' },
          ]}
          height={260}
        />
      </div>

      <div className="bg-white border border-[#e2dfd8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2dfd8]">
          <h3 className="font-display text-base font-bold">Top páginas</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7f5f0]">
              <th className="text-left px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Página</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Sesiones</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Usuarios</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Conv.</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Conv. rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2dfd8]">
            {pages.map(p => (
              <tr key={p.page_path} className="hover:bg-[#f7f5f0] transition-colors">
                <td className="px-6 py-2.5 font-mono text-xs text-[#1a4fa0]">{p.page_path}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18] font-medium">{p.sessions.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#4a4a42]">{p.users.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18]">{p.conversions}</td>
                <td className="px-6 py-2.5 text-right">
                  <span className={`font-mono text-xs ${p.conversion_rate > 3 ? 'text-[#1a7a4a]' : 'text-[#9a9a8e]'}`}>
                    {p.conversion_rate.toFixed(1)}%
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
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-8 max-w-5xl">
      <div className="bg-[#fef0ed] border border-[#e8321a] border-l-4 border-l-[#e8321a] px-5 py-4">
        <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#e8321a] mb-1">Error cargando datos</p>
        <p className="text-sm text-[#4a4a42]">{message}</p>
        {message.includes('Configuración') && (
          <a href="/config" className="inline-block mt-3 font-mono text-[10px] uppercase tracking-wide bg-[#1a1a18] text-white px-4 py-2 hover:bg-[#e8321a] transition-colors">
            Ir a Configuración →
          </a>
        )}
      </div>
    </div>
  )
}
