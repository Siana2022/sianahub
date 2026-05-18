import Topbar from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/server'
import AlertsClient from '@/components/alerts/AlertsClient'
import { Alerta } from '@/types/alertas'

export const dynamic = 'force-dynamic'

export default async function AlertasPage() {
  const supabase = await createClient()

  const { data: alertas } = await supabase
    .from('alertas')
    .select('*, clientes(nombre)')
    .in('estado', ['pending', 'reviewing'])
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (alertas ?? []) as (Alerta & { clientes: { nombre: string } | null })[]

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Alertas" subtitle="Centro de alertas" />
      <div className="flex-1 overflow-auto p-8 space-y-8">
        <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#000000]">
          <h2 className="font-display text-2xl font-bold">Centro de Alertas</h2>
          <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#888888]">
            tiempo real
          </span>
        </div>

        <AlertsClient alertas={rows} />
      </div>
    </div>
  )
}
