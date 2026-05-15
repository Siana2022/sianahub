'use client'

import { useRouter } from 'next/navigation'

export default function GoogleConnectButton({ isConnected }: { isConnected: boolean }) {
  const router = useRouter()

  async function handleDisconnect() {
    await fetch('/api/auth/google/disconnect', { method: 'POST' })
    router.refresh()
  }

  if (isConnected) {
    return (
      <button
        onClick={handleDisconnect}
        className="font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#F7415C] border border-[#e8e8e8] hover:border-[#F7415C] px-4 py-2 transition-colors"
      >
        Desconectar Google
      </button>
    )
  }

  return (
    <a
      href="/api/auth/google"
      className="inline-block font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-5 py-2 hover:bg-[#F7415C] transition-colors"
    >
      Conectar con Google →
    </a>
  )
}
