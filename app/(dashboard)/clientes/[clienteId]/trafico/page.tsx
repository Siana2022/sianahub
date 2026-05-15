'use client'

import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { mockGA4Summary, mockTopPages } from '@/lib/mock/metricas'

export default function TraficoPage() {
  const ga4   = mockGA4Summary()
  const pages = mockTopPages()

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Section header */}
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#1a1a18]">
        <h2 className="font-display text-2xl font-bold">Tráfico web</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#9a9a8e]">últimos 30 días</span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        <KpiCard label="Sesiones"      value={ga4.sessions}  prev={ga4.sessions_prev} />
        <KpiCard label="Usuarios"      value={ga4.users}     prev={ga4.users_prev} />
        <KpiCard label="Tasa rebote"   value={`${ga4.bounce_rate.toFixed(1)}%`} invertColors />
        <KpiCard label="Duración media" value={`${Math.round(ga4.avg_session_duration)}s`} />
      </div>

      {/* Chart */}
      <div className="bg-white border border-[#e2dfd8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Sesiones y usuarios</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-5">evolución diaria — 30 días</p>
        <LineChart
          data={ga4.daily}
          series={[
            { key: 'sessions',  label: 'Sesiones',  color: '#1a4fa0' },
            { key: 'users',     label: 'Usuarios',  color: '#1a7a4a' },
            { key: 'new_users', label: 'Nuevos',    color: '#d4820a' },
          ]}
          height={260}
        />
      </div>

      {/* Table */}
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
