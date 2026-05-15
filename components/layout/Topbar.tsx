import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface TopbarProps {
  title: string
  subtitle?: string
}

export default async function Topbar({ title, subtitle }: TopbarProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: alertasPendientes } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pending')
    .in('severidad', ['critical', 'high'])

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'SD'

  return (
    <header className="bg-[#1a1a18] text-white px-8 py-6 flex items-end justify-between">
      <div>
        <p className="font-mono text-[9px] tracking-[3px] uppercase text-white/30 mb-1">
          {subtitle ?? 'Cliente'}
        </p>
        <h1 className="font-display text-2xl font-bold text-white leading-none">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell className="w-4 h-4 text-white/40" />
          {alertasPendientes != null && alertasPendientes > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#e8321a] rounded-full text-[8px] text-white flex items-center justify-center font-bold font-mono">
              {alertasPendientes > 9 ? '9+' : alertasPendientes}
            </span>
          )}
        </div>
        <div className="w-7 h-7 bg-[#e8321a] flex items-center justify-center">
          <span className="text-white text-xs font-mono font-medium">{initials}</span>
        </div>
      </div>
    </header>
  )
}
