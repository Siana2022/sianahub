'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Bell, Tag, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/overview',  label: 'Overview',  icon: LayoutDashboard },
  { href: '/clientes',  label: 'Clientes',  icon: Users },
  { href: '/alertas',   label: 'Alertas',   icon: Bell },
  { href: '/gtm',       label: 'GTM',       icon: Tag },
  { href: '/config',    label: 'Config',    icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-52 min-h-screen bg-[#000000] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <p className="font-display text-xl font-bold text-white leading-none">
          Siana<span className="text-[#F7415C]">Hub</span>
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/overview' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-base font-bold transition-colors rounded-none',
                active
                  ? 'bg-white text-[#000000]'
                  : 'text-white hover:bg-white hover:text-[#000000]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-base font-bold text-white/40 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </aside>
  )
}
