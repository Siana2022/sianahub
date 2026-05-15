import Topbar from '@/components/layout/Topbar'

export default function GtmPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="GTM" />
      <div className="p-6 text-gray-400 text-sm">
        Vista global GTM — disponible en Fase 5.
      </div>
    </div>
  )
}
