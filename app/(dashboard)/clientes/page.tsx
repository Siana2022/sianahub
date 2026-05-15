import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Cliente } from '@/types/cliente'

function HealthDot({ estado }: { estado: Cliente['estado'] }) {
  const colors = {
    active: 'bg-green-500',
    paused: 'bg-yellow-400',
    churned: 'bg-gray-500',
  }
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[estado]}`} />
  )
}

function estadoLabel(estado: Cliente['estado']) {
  return { active: 'Activo', paused: 'Pausado', churned: 'Churn' }[estado]
}

function platformBadges(c: Cliente) {
  const platforms = []
  if (c.ga4_property_id) platforms.push('GA4')
  if (c.gads_customer_id) platforms.push('Ads')
  if (c.meta_ad_account_id) platforms.push('Meta')
  if (c.gsc_site_url) platforms.push('GSC')
  if (c.gtm_container_id) platforms.push('GTM')
  return platforms
}

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('estado')
    .order('nombre')

  const activos = clientes?.filter((c) => c.estado === 'active').length ?? 0
  const pausados = clientes?.filter((c) => c.estado === 'paused').length ?? 0

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Clientes" />

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-gray-400">
            <span><span className="text-white font-medium">{activos}</span> activos</span>
            {pausados > 0 && (
              <span><span className="text-yellow-400 font-medium">{pausados}</span> pausados</span>
            )}
          </div>
          <Link href="/clientes/nuevo" className={cn(buttonVariants({ size: 'sm' }), 'bg-blue-600 hover:bg-blue-500 text-white')}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo cliente
          </Link>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Dominio</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Plataformas</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {clientes?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HealthDot estado={c.estado} />
                      <span className="text-white font-medium">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{c.dominio ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {platformBadges(c).map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-xs">{estadoLabel(c.estado)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!clientes || clientes.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No hay clientes aún.{' '}
                    <Link href="/clientes/nuevo" className="text-blue-400 hover:underline">
                      Añade el primero →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
