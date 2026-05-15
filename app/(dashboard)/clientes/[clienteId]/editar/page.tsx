import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import ClienteForm from '@/components/clientes/ClienteForm'

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>
}) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()

  if (error || !cliente) notFound()

  return (
    <div className="flex flex-col h-full">
      <Topbar title={`Editar — ${cliente.nombre}`} />
      <div className="p-6 max-w-3xl">
        <ClienteForm cliente={cliente} />
      </div>
    </div>
  )
}
