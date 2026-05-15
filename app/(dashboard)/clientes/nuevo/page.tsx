import Topbar from '@/components/layout/Topbar'
import ClienteForm from '@/components/clientes/ClienteForm'

export default function NuevoClientePage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Nuevo cliente" />
      <div className="p-6">
        <ClienteForm />
      </div>
    </div>
  )
}
