'use client'

import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { mockAdsSummary, mockAdsCampaigns } from '@/lib/mock/metricas'

export default function GoogleAdsPage() {
  const ads = mockAdsSummary()
  const campaigns = mockAdsCampaigns()

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Inversión" value={`€${ads.spend.toFixed(0)}`} prev={`€${ads.spend_prev.toFixed(0)}`} />
        <KpiCard label="Conversiones" value={ads.conversions} prev={ads.conversions_prev} />
        <KpiCard label="CPL" value={`€${ads.cpl.toFixed(2)}`} prev={`€${ads.cpl_prev.toFixed(2)}`} invertColors />
        <KpiCard label="ROAS" value={`${ads.roas.toFixed(2)}x`} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Clicks" value={ads.clicks.toLocaleString()} />
        <KpiCard label="Impresiones" value={(ads.impressions / 1000).toFixed(1) + 'k'} />
        <KpiCard label="CTR" value={`${ads.ctr.toFixed(2)}%`} />
        <KpiCard label="CPC" value={`€${ads.cpc.toFixed(2)}`} invertColors />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="text-white text-sm font-medium mb-4">Inversión y conversiones — últimos 30 días</h3>
        <LineChart
          data={ads.daily}
          series={[
            { key: 'spend', label: 'Inversión (€)', color: '#3b82f6' },
            { key: 'conversions', label: 'Conversiones', color: '#10b981' },
          ]}
          height={260}
          formatTooltip={(v, key) => key === 'spend' ? `€${v.toFixed(2)}` : String(v)}
        />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-white text-sm font-medium">Campañas</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-2.5 text-gray-400 text-xs font-medium">Campaña</th>
              <th className="text-left px-4 py-2.5 text-gray-400 text-xs font-medium">Estado</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Inversión</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Clicks</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Conv.</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">CPL</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {campaigns.map(c => (
              <tr key={c.nombre} className="hover:bg-gray-800/40">
                <td className="px-4 py-2.5 text-gray-300 max-w-xs truncate">{c.nombre}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    c.estado === 'ENABLED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {c.estado === 'ENABLED' ? 'Activa' : 'Pausada'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-white text-right font-medium">€{c.spend.toFixed(0)}</td>
                <td className="px-4 py-2.5 text-gray-300 text-right">{c.clicks.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-white text-right">{c.conversions}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={c.cpl < 20 ? 'text-green-400' : c.cpl < 35 ? 'text-yellow-400' : 'text-red-400'}>
                    €{c.cpl.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-300 text-right">{c.ctr.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
