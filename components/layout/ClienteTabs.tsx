'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '',                  label: 'Resumen' },
  { href: '/informe',          label: 'Informe' },
  { href: '/leads',            label: 'Leads' },
  { href: '/procedencia',      label: 'Procedencia' },
  { href: '/trafico',          label: 'Tráfico' },
  { href: '/organico',         label: 'Orgánico' },
  { href: '/meta',             label: 'Meta Ads' },
  { href: '/google-ads',       label: 'Google Ads' },
  { href: '/gtm',              label: 'GTM' },
  { href: '/metricas-custom',  label: 'Custom' },
  { href: '/ia',               label: 'IA' },
]

export default function ClienteTabs({ clienteId }: { clienteId: string }) {
  const pathname = usePathname()
  const base = `/clientes/${clienteId}`

  return (
    <div className="bg-white border-b border-[#e8e8e8] px-8 overflow-x-auto">
      <nav className="flex -mb-px whitespace-nowrap">
        {tabs.map(tab => {
          const href = `${base}${tab.href}`
          const active = tab.href === ''
            ? pathname === base
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={tab.href}
              href={href}
              className={`px-4 py-3.5 text-base font-bold border-b-2 transition-colors shrink-0 ${
                active
                  ? 'border-[#F7415C] text-[#F7415C]'
                  : 'border-transparent text-[#888888] hover:text-[#000000] hover:border-[#000000]'
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
