'use client'

import { useRouter } from 'next/navigation'

export default function MetaConnectButton({ isConnected, expiresAt }: { isConnected: boolean; expiresAt?: string | null }) {
  const router = useRouter()

  async function handleDisconnect() {
    await fetch('/api/auth/meta/disconnect', { method: 'POST' })
    router.refresh()
  }

  if (isConnected) {
    return (
      <div className="space-y-3">
        {expiresAt && (
          <p className="font-mono text-[9px] text-[#888888]">
            Token válido hasta: {new Date(expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        <div className="flex gap-3">
          <a
            href="/api/auth/meta/connect"
            className="inline-block font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-5 py-2 hover:bg-[#1a4fa0] transition-colors"
          >
            Reconectar →
          </a>
          <button
            onClick={handleDisconnect}
            className="font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#F7415C] border border-[#e8e8e8] hover:border-[#F7415C] px-4 py-2 transition-colors"
          >
            Desconectar
          </button>
        </div>
      </div>
    )
  }

  return (
    <a
      href="/api/auth/meta/connect"
      className="inline-block font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-5 py-2 hover:bg-[#F7415C] transition-colors"
    >
      Conectar con Meta →
    </a>
  )
}
