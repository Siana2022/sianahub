'use client'

import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { mockGSCSummary, mockKeywords } from '@/lib/mock/metricas'

export default function OrganicoPage() {
  const gsc      = mockGSCSummary()
  const keywords = mockKeywords()

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#1a1a18]">
        <h2 className="font-display text-2xl font-bold">SEO / Orgánico</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#9a9a8e]">Google Search Console</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        <KpiCard label="Clicks GSC"     value={gsc.clicks}     prev={gsc.clicks_prev} />
        <KpiCard label="Impresiones"    value={gsc.impressions.toLocaleString()} />
        <KpiCard label="CTR medio"      value={`${gsc.ctr.toFixed(2)}%`} />
        <KpiCard label="Posición media" value={gsc.position.toFixed(1)} invertColors />
      </div>

      <div className="bg-white border border-[#e2dfd8] p-6">
        <h3 className="font-display text-base font-bold mb-1">Clicks e impresiones</h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-5">evolución diaria — 30 días</p>
        <LineChart
          data={gsc.daily}
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
              <th className="text-left px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">Keyword</th>
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
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#1a1a18] font-medium">{kw.clicks}</td>
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
