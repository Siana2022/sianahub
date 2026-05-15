import Topbar from '@/components/layout/Topbar'

export default function ConfigPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Configuración" />
      <div className="p-6 text-gray-400 text-sm">
        Configuración — tokens OAuth y reglas de alerta. Disponible próximamente.
      </div>
    </div>
  )
}
