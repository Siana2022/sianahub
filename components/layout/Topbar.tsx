import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

interface TopbarProps {
  title: string
}

export default async function Topbar({ title }: TopbarProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: alertasPendientes } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pending')
    .in('severidad', ['critical', 'high'])

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'SD'

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-6">
      <h1 className="text-white font-medium text-sm">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell className="w-4 h-4 text-gray-400" />
          {alertasPendientes && alertasPendientes > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {alertasPendientes > 9 ? '9+' : alertasPendientes}
            </span>
          )}
        </div>
        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-medium">{initials}</span>
        </div>
      </div>
    </header>
  )
}
