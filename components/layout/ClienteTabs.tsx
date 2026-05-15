'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '', label: 'Resumen' },
  { href: '/leads', label: 'Leads' },
  { href: '/procedencia', label: 'Procedencia' },
  { href: '/trafico', label: 'Tráfico' },
  { href: '/organico', label: 'Orgánico' },
  { href: '/meta', label: 'Meta Ads' },
  { href: '/google-ads', label: 'Google Ads' },
  { href: '/gtm', label: 'GTM' },
  { href: '/metricas-custom', label: 'Custom' },
  { href: '/ia', label: 'IA' },
]

export default function ClienteTabs({ clienteId }: { clienteId: string }) {
  const pathname = usePathname()
  const base = `/clientes/${clienteId}`

  return (
    <div className="border-b border-gray-800 px-6">
      <nav className="flex -mb-px overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const href = `${base}${tab.href}`
          const active = tab.href === ''
            ? pathname === base
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={tab.href}
              href={href}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                active
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
