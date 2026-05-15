'use client'

import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { mockMetaSummary, mockMetaCampaigns } from '@/lib/mock/metricas'

export default function MetaPage() {
  const meta      = mockMetaSummary()
  const campaigns = mockMetaCampaigns()

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#000000]">
        <h2 className="font-display text-2xl font-bold">Meta Ads</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#888888]">últimos 30 días</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        <KpiCard label="Inversión"    value={`€${meta.spend.toFixed(0)}`}   prev={`€${meta.spend_prev.toFixed(0)}`} />
        <KpiCard label="Conversiones" value={meta.conversions}               prev={meta.conversions_prev} />
        <KpiCard label="CPL"          value={`€${meta.cpl.toFixed(2)}`}     prev={`€${meta.cpl_prev.toFixed(2)}`} invertColors />
        <KpiCard label="Alcance"      value={`${(meta.reach / 1000).toFixed(1)}k`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        <KpiCard label="Impresiones"     value={`${(meta.impressions / 1000).toFixed(1)}k`} />
        <KpiCard label="Clicks"          value={meta.clicks.toLocaleString()} />
        <KpiCard label="CTR"             value={`${meta.ctr.toFixed(2)}%`} />
        <KpiCard label="Visualiz. vídeo" value={`${(meta.video_views / 1000).toFixed(1)}k`} />
      </div>

      <div className="bg-white border border-[#e8e8e8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Inversión y conversiones</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-5">evolución diaria — 30 días</p>
        <LineChart
          data={meta.daily}
          series={[
            { key: 'spend',       label: 'Inversión (€)', color: '#F7415C' },
            { key: 'conversions', label: 'Conversiones',  color: '#1a7a4a' },
            { key: 'reach',       label: 'Alcance',       color: '#888888' },
          ]}
          height={240}
          formatTooltip={(v, key) => key === 'spend' ? `€${v.toFixed(2)}` : v.toLocaleString()}
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
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Alcance</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Conv.</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">CPL</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e8e8]">
            {campaigns.map(c => (
              <tr key={c.nombre} className="hover:bg-[#ffffff] transition-colors">
                <td className="px-6 py-2.5 text-[#000000] font-medium max-w-xs truncate">{c.nombre}</td>
                <td className="px-6 py-2.5">
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 tracking-wide uppercase ${
                    c.estado === 'ACTIVE'
                      ? 'bg-[#edfaf2] text-[#1a7a4a]'
                      : 'bg-[#ffffff] text-[#888888]'
                  }`}>
                    {c.estado === 'ACTIVE' ? 'Activa' : 'Pausada'}
                  </span>
                </td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#000000] font-medium">€{c.spend.toFixed(0)}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#555555]">{c.reach.toLocaleString()}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#000000]">{c.conversions}</td>
                <td className="px-6 py-2.5 text-right">
                  <span className={`font-mono text-xs ${c.cpl < 20 ? 'text-[#1a7a4a]' : c.cpl < 35 ? 'text-[#d4820a]' : 'text-[#F7415C]'}`}>
                    €{c.cpl.toFixed(2)}
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
