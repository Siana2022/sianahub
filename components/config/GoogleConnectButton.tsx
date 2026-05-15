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
        className="font-mono text-[10px] uppercase tracking-wide text-[#9a9a8e] hover:text-[#e8321a] border border-[#e2dfd8] hover:border-[#e8321a] px-4 py-2 transition-colors"
      >
        Desconectar Google
      </button>
    )
  }

  return (
    <a
      href="/api/auth/google"
      className="inline-block font-mono text-[10px] uppercase tracking-wide bg-[#1a1a18] text-white px-5 py-2 hover:bg-[#e8321a] transition-colors"
    >
      Conectar con Google →
    </a>
  )
}
