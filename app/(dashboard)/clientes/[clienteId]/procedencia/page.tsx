import KpiCard from '@/components/dashboard/KpiCard'
import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'
import { mockTrafficSources, mockGeoData, mockDeviceData, mockGA4Summary } from '@/lib/mock/metricas'

export default function ProcedenciaPage() {
  const sources = mockTrafficSources()
  const geo = mockGeoData()
  const devices = mockDeviceData()
  const ga4 = mockGA4Summary()

  const topSources = [...sources]
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6)
    .map(s => ({
      ...s,
      label: `${s.source} / ${s.medium}`,
      ctr: s.sessions > 0 ? ((s.conversions / s.sessions) * 100).toFixed(1) : '0',
    }))

  const deviceDonut = devices.map(d => ({ name: d.device, value: d.sessions }))
  const geoDonut = geo.map(g => ({ name: g.country, value: g.sessions }))

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Sesiones totales" value={ga4.sessions} prev={ga4.sessions_prev} />
        <KpiCard label="Usuarios" value={ga4.users} prev={ga4.users_prev} />
        <KpiCard label="Conv. rate" value={`${ga4.conversion_rate.toFixed(2)}%`} />
        <KpiCard label="Fuentes activas" value={sources.length} />
      </div>

      {/* Fuentes por sesiones */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="text-white text-sm font-medium mb-4">Sesiones por fuente / medio</h3>
        <BarChart
          data={topSources}
          xKey="label"
          yKey="sessions"
          color="#3b82f6"
          height={240}
          horizontal
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Dispositivos */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-white text-sm font-medium mb-1">Dispositivos</h3>
          <DonutChart data={deviceDonut} height={200} formatValue={v => v.toLocaleString()} />
        </div>

        {/* Geografía */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-white text-sm font-medium mb-1">Países</h3>
          <DonutChart data={geoDonut} height={200} formatValue={v => v.toLocaleString()} />
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-white text-sm font-medium">Detalle por fuente</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-2.5 text-gray-400 text-xs font-medium">Fuente / Medio</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Sesiones</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Conversiones</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Conv. rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {topSources.map(s => (
              <tr key={s.label} className="hover:bg-gray-800/40">
                <td className="px-4 py-2.5 text-gray-300">{s.label}</td>
                <td className="px-4 py-2.5 text-white text-right">{s.sessions.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-white text-right">{s.conversions}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-green-400">{s.ctr}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
