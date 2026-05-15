'use client'

import KpiCard from '@/components/dashboard/KpiCard'
import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'
import { mockTrafficSources, mockGeoData, mockDeviceData, mockGA4Summary } from '@/lib/mock/metricas'

export default function ProcedenciaPage() {
  const sources = mockTrafficSources()
  const geo     = mockGeoData()
  const devices = mockDeviceData()
  const ga4     = mockGA4Summary()

  const topSources = [...sources]
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6)
    .map(s => ({
      ...s,
      label: `${s.source} / ${s.medium}`,
      ctr: s.sessions > 0 ? ((s.conversions / s.sessions) * 100).toFixed(1) : '0',
    }))

  const deviceDonut = devices.map(d => ({ name: d.device,   value: d.sessions }))
  const geoDonut    = geo.map(g =>     ({ name: g.country,  value: g.sessions }))

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#1a1a18]">
        <h2 className="font-display text-2xl font-bold">Procedencia</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#9a9a8e]">fuentes · dispositivos · países</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        <KpiCard label="Sesiones totales" value={ga4.sessions}  prev={ga4.sessions_prev} />
        <KpiCard label="Usuarios"         value={ga4.users}     prev={ga4.users_prev} />
        <KpiCard label="Conv. rate"        value={`${ga4.conversion_rate.toFixed(2)}%`} />
        <KpiCard label="Fuentes activas"   value={sources.length} />
      </div>

      {/* Bar chart — sources */}
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

      {/* Detail table */}
      <div className="bg-white border border-[#e2dfd8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2dfd8]">
          <h3 className="font-display text-base font-bold">Detalle por fuente</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7f5f0]">
              <th className="text-left  px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Fuente / Medio</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Sesiones</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Conversiones</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Conv. rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2dfd8]">
            {topSources.map(s => (
              <tr key={s.label} className="hover:bg-[#f7f5f0] transition-colors">
                <td className="px-6 py-2.5 text-[#1a1a18] font-medium">{s.label}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18]">{s.sessions.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18]">{s.conversions}</td>
                <td className="px-6 py-2.5 text-right">
                  <span className="font-mono text-xs text-[#1a7a4a]">{s.ctr}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
