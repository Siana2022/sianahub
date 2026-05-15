import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'
import { mockGA4Summary, mockTopPages } from '@/lib/mock/metricas'

export default function TraficoPage() {
  const ga4 = mockGA4Summary()
  const pages = mockTopPages()

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Sesiones" value={ga4.sessions} prev={ga4.sessions_prev} />
        <KpiCard label="Usuarios" value={ga4.users} prev={ga4.users_prev} />
        <KpiCard label="Rebote" value={`${ga4.bounce_rate.toFixed(1)}%`} invertColors />
        <KpiCard label="Duración media" value={`${Math.round(ga4.avg_session_duration)}s`} />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="text-white text-sm font-medium mb-4">Sesiones y usuarios — últimos 30 días</h3>
        <LineChart
          data={ga4.daily}
          series={[
            { key: 'sessions', label: 'Sesiones', color: '#3b82f6' },
            { key: 'users', label: 'Usuarios', color: '#10b981' },
            { key: 'new_users', label: 'Nuevos', color: '#f59e0b' },
          ]}
          height={280}
        />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-white text-sm font-medium">Top páginas</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-2.5 text-gray-400 text-xs font-medium">Página</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Sesiones</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Usuarios</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Conversiones</th>
              <th className="text-right px-4 py-2.5 text-gray-400 text-xs font-medium">Conv. rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {pages.map(p => (
              <tr key={p.page_path} className="hover:bg-gray-800/40">
                <td className="px-4 py-2.5 text-blue-400 font-mono text-xs">{p.page_path}</td>
                <td className="px-4 py-2.5 text-white text-right">{p.sessions.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-gray-300 text-right">{p.users.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-white text-right">{p.conversions}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={p.conversion_rate > 3 ? 'text-green-400' : 'text-gray-400'}>
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
