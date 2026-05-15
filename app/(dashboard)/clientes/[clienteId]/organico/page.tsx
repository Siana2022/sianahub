'use client'

import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { mockGSCSummary, mockKeywords } from '@/lib/mock/metricas'

export default function OrganicoPage() {
  const gsc = mockGSCSummary()
  const keywords = mockKeywords()

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Clicks GSC" value={gsc.clicks} prev={gsc.clicks_prev} />
        <KpiCard label="Impresiones" value={gsc.impressions.toLocaleString()} />
        <KpiCard label="CTR medio" value={`${gsc.ctr.toFixed(2)}%`} />
        <KpiCard label="Posición media" value={gsc.position.toFixed(1)} invertColors />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="text-white text-sm font-medium mb-4">Clicks e impresiones — últimos 30 días</h3>
        <LineChart
          data={gsc.daily}
          series={[
            { key: 'gsc_clicks', label: 'Clicks', color: '#10b981' },
            { key: 'gsc_impressions', label: 'Impresiones', color: '#6b7280' },
          ]}
          height={260}
          formatY={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
        />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-white text-sm font-medium">Top keywords</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-2.5 text-gray-400 text-xs font-medium">Keyword</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Clicks</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Impresiones</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">CTR</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Posición</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {keywords.map(kw => (
              <tr key={kw.keyword} className="hover:bg-gray-800/40">
                <td className="px-4 py-2.5 text-gray-300">{kw.keyword}</td>
                <td className="px-4 py-2.5 text-white text-right font-medium">{kw.clicks}</td>
                <td className="px-4 py-2.5 text-gray-400 text-right">{kw.impressions.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={kw.ctr > 5 ? 'text-green-400' : 'text-gray-400'}>
                    {kw.ctr.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={kw.position <= 5 ? 'text-green-400' : kw.position <= 15 ? 'text-yellow-400' : 'text-red-400'}>
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
