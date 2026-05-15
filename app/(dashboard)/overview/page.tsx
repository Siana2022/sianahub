import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import type { Cliente } from '@/types/cliente'

function estadoBadge(estado: Cliente['estado']) {
  const map = {
    active: { label: 'Activo', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    paused: { label: 'Pausado', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    churned: { label: 'Churn', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  return map[estado]
}

export default async function OverviewPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { count: alertasCriticas }, { count: totalClientes }] =
    await Promise.all([
      supabase
        .from('clientes')
        .select('id, nombre, dominio, estado, alertas_activas')
        .eq('estado', 'active')
        .order('nombre')
        .limit(10),
      supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pending')
        .eq('severidad', 'critical'),
      supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'active'),
    ])

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Overview" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Clientes activos</p>
            <p className="text-white text-2xl font-bold mt-1">{totalClientes ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Alertas críticas</p>
            <p className={`text-2xl font-bold mt-1 ${alertasCriticas && alertasCriticas > 0 ? 'text-red-400' : 'text-white'}`}>
              {alertasCriticas ?? 0}
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Plataforma</p>
            <p className="text-green-400 text-sm font-medium mt-1">Operativa</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-white text-sm font-medium">Clientes recientes</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {clientes?.map((c) => {
              const badge = estadoBadge(c.estado)
              return (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{c.nombre}</p>
                    {c.dominio && <p className="text-gray-500 text-xs">{c.dominio}</p>}
                  </div>
                  <Badge className={`text-xs border ${badge.className}`}>
                    {badge.label}
                  </Badge>
                </div>
              )
            })}
            {(!clientes || clientes.length === 0) && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Aún no hay clientes. <a href="/clientes/nuevo" className="text-blue-400 hover:underline">Añade el primero →</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
