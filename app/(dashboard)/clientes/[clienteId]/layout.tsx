import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import ClienteTabs from '@/components/layout/ClienteTabs'

export default async function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clienteId: string }>
}) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('id, nombre, dominio, estado')
    .eq('id', clienteId)
    .single()

  if (error || !cliente) notFound()

  return (
    <div className="flex flex-col h-full">
      <Topbar title={cliente.nombre} />
      <ClienteTabs clienteId={clienteId} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
