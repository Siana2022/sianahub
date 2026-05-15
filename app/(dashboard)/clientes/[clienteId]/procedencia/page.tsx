'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'

type Summary = {
  sessions: number; sessions_prev: number
  users: number; users_prev: number
  conversions: number; conversions_prev: number; conversion_rate: number
}
type Source  = { source: string; medium: string; sessions: number; users: number; conversions: number }
type Device  = { device: string; sessions: number }
type Geo     = { country: string; sessions: number }

export default function ProcedenciaPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [geo,     setGeo]     = useState<Geo[]>([])
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clientes/${clienteId}/ga4/procedencia`)
        if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
        const data = await res.json()
        setSummary(data.summary)
        setSources(data.sources)
        setDevices(data.devices)
        setGeo(data.geo)
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

  const topSources = sources.slice(0, 6).map(s => ({
    ...s,
    label: `${s.source} / ${s.medium}`,
    conv_rate: s.sessions > 0 ? ((s.conversions / s.sessions) * 100).toFixed(1) : '0',
  }))

  const deviceDonut = devices.map(d => ({ name: d.device,  value: d.sessions }))
  const geoDonut    = geo.map(g =>     ({ name: g.country, value: g.sessions }))

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#1a1a18]">
        <h2 className="font-display text-2xl font-bold">Procedencia</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#9a9a8e]">últimos 30 días · GA4</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        <KpiCard label="Sesiones totales" value={summary!.sessions.toLocaleString()}   prev={summary!.sessions_prev} />
        <KpiCard label="Usuarios"         value={summary!.users.toLocaleString()}      prev={summary!.users_prev} />
        <KpiCard label="Conversiones"     value={summary!.conversions.toLocaleString()} prev={summary!.conversions_prev} />
        <KpiCard label="Conv. rate"        value={`${summary!.conversion_rate.toFixed(2)}%`} />
      </div>

      <div className="bg-white border border-[#e2dfd8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Sesiones por fuente / medio</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-5">top 6 canales</p>
        <BarChart
          data={topSources}
          xKey="label"
          yKey="sessions"
          color="#e8321a"
          height={220}
          horizontal
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#e2dfd8] p-6">
          <h3 className="font-display text-base font-bold mb-1">Dispositivos</h3>
          <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-3">distribución de sesiones</p>
          <DonutChart data={deviceDonut} height={200} formatValue={v => v.toLocaleString()} />
        </div>
        <div className="bg-white border border-[#e2dfd8] p-6">
          <h3 className="font-display text-base font-bold mb-1">Países</h3>
          <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-3">distribución de sesiones</p>
          <DonutChart data={geoDonut} height={200} formatValue={v => v.toLocaleString()} />
        </div>
      </div>

      <div className="bg-white border border-[#e2dfd8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2dfd8]">
          <h3 className="font-display text-base font-bold">Detalle por fuente</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7f5f0]">
              <th className="text-left  px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Fuente / Medio</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Sesiones</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Usuarios</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Conv.</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Conv. rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2dfd8]">
            {topSources.map(s => (
              <tr key={s.label} className="hover:bg-[#f7f5f0] transition-colors">
                <td className="px-6 py-2.5 text-[#1a1a18] font-medium">{s.label}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18]">{s.sessions.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#4a4a42]">{s.users.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18]">{s.conversions}</td>
                <td className="px-6 py-2.5 text-right">
                  <span className={`font-mono text-xs ${parseFloat(s.conv_rate) > 3 ? 'text-[#1a7a4a]' : 'text-[#9a9a8e]'}`}>
                    {s.conv_rate}%
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
      <div className="bg-white border border-[#e2dfd8] h-64 animate-pulse" />
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#e2dfd8] h-56 animate-pulse" />
        <div className="bg-white border border-[#e2dfd8] h-56 animate-pulse" />
      </div>
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
