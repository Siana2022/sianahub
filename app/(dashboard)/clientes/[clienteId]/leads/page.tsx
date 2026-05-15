import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { mockGA4Summary, mockAdsSummary, mockMetaSummary } from '@/lib/mock/metricas'

export default function LeadsPage() {
  const ga4 = mockGA4Summary()
  const ads = mockAdsSummary()
  const meta = mockMetaSummary()

  const totalLeads = ga4.conversions + ads.conversions + meta.conversions
  const totalPrev = (ga4.conversions_prev ?? 0) + (ads.conversions_prev ?? 0) + (meta.conversions_prev ?? 0)

  // Combinar series diarias para el gráfico
  const combined = ga4.daily.map((d, i) => ({
    fecha: d.fecha,
    organico: d.conversions,
    google_ads: ads.daily[i]?.conversions ?? 0,
    meta: meta.daily[i]?.conversions ?? 0,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Leads totales" value={totalLeads} prev={totalPrev} />
        <KpiCard label="Google Ads" value={ads.conversions} prev={ads.conversions_prev} />
        <KpiCard label="Meta Ads" value={meta.conversions} prev={meta.conversions_prev} />
        <KpiCard label="Orgánico" value={ga4.conversions} prev={ga4.conversions_prev} />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="text-white text-sm font-medium mb-4">Leads por día — últimos 30 días</h3>
        <LineChart
          data={combined}
          series={[
            { key: 'organico', label: 'Orgánico', color: '#10b981' },
            { key: 'google_ads', label: 'Google Ads', color: '#3b82f6' },
            { key: 'meta', label: 'Meta', color: '#8b5cf6' },
          ]}
          height={280}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">Google Ads</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Leads</span><span className="text-white font-medium">{ads.conversions}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Inversión</span><span className="text-white font-medium">€{ads.spend.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">CPL</span><span className="text-white font-medium">€{ads.cpl.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">ROAS</span><span className="text-white font-medium">{ads.roas.toFixed(2)}x</span></div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">Meta Ads</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Leads</span><span className="text-white font-medium">{meta.conversions}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Inversión</span><span className="text-white font-medium">€{meta.spend.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">CPL</span><span className="text-white font-medium">€{meta.cpl.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">CTR</span><span className="text-white font-medium">{meta.ctr.toFixed(2)}%</span></div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">Orgánico</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Leads</span><span className="text-white font-medium">{ga4.conversions}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Sesiones</span><span className="text-white font-medium">{ga4.sessions.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Conv. rate</span><span className="text-white font-medium">{ga4.conversion_rate.toFixed(2)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Rebote</span><span className="text-white font-medium">{ga4.bounce_rate.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
