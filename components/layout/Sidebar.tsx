'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Bell,
  Tag,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/gtm', label: 'GTM', icon: Tag },
  { href: '/config', label: 'Config', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
      <div className="px-4 py-5 flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">S</span>
        </div>
        <span className="text-white font-semibold text-sm">SianaHub</span>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== '/overview' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-900 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
