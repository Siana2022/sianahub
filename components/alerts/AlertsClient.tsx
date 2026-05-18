'use client'

import { useState } from 'react'
import { Alerta } from '@/types/alertas'

interface AlertRowProps {
  alerta: Alerta & { clientes: { nombre: string } | null }
  onResolved: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-[#F7415C]',
  high: 'bg-[#d4820a]',
  medium: 'bg-[#f5c842]',
  low: 'bg-[#1a4fa0]',
}

const ESTADO_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  reviewing: 'Revisando',
  resolved: 'Resuelto',
}

export function AlertRow({ alerta, onResolved }: AlertRowProps) {
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState(alerta.estado)

  async function handleResolve() {
    setLoading(true)
    try {
      const res = await fetch(`/api/alertas/${alerta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'resolved' }),
      })
      if (res.ok) {
        setEstado('resolved')
        onResolved(alerta.id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleReview() {
    setLoading(true)
    try {
      const res = await fetch(`/api/alertas/${alerta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'reviewing' }),
      })
      if (res.ok) {
        setEstado('reviewing')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr className="border-b border-[#e8e8e8] hover:bg-[#f9f9f9] transition-colors">
      <td className="px-4 py-3">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${SEVERITY_DOT[alerta.severidad] ?? 'bg-[#888888]'}`}
        />
      </td>
      <td className="px-4 py-3 font-mono text-[10px] text-[#555555]">
        {alerta.clientes?.nombre ?? '—'}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[#000000]">{alerta.titulo}</p>
        {alerta.descripcion && (
          <p className="font-mono text-[9px] text-[#888888] mt-0.5 max-w-xs truncate">
            {alerta.descripcion}
          </p>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-[9px] tracking-[1px] uppercase text-[#888888]">
        {alerta.tipo.replace(/_/g, ' ')}
      </td>
      <td className="px-4 py-3 font-mono text-[9px] text-[#888888]">
        {timeAgo(alerta.created_at)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 font-mono text-[8px] tracking-[1px] uppercase font-medium ${
            estado === 'resolved'
              ? 'bg-[#e8e8e8] text-[#555555]'
              : estado === 'reviewing'
              ? 'bg-[#f5c842]/20 text-[#d4820a]'
              : 'bg-[#F7415C]/10 text-[#F7415C]'
          }`}
        >
          {ESTADO_LABEL[estado] ?? estado}
        </span>
      </td>
      <td className="px-4 py-3">
        {estado !== 'resolved' && (
          <div className="flex gap-2">
            {estado === 'pending' && (
              <button
                onClick={handleReview}
                disabled={loading}
                className="font-mono text-[9px] tracking-[1px] uppercase text-[#555555] hover:text-[#000000] disabled:opacity-40 transition-colors"
              >
                Revisar
              </button>
            )}
            <button
              onClick={handleResolve}
              disabled={loading}
              className="font-mono text-[9px] tracking-[1px] uppercase text-[#F7415C] hover:text-[#000000] disabled:opacity-40 transition-colors"
            >
              Resolver
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

interface AlertsTableProps {
  alertas: (Alerta & { clientes: { nombre: string } | null })[]
}

export default function AlertsClient({ alertas: initial }: AlertsTableProps) {
  const [alertas, setAlertas] = useState(initial)

  function handleResolved(id: string) {
    setAlertas(prev =>
      prev.map(a => (a.id === id ? { ...a, estado: 'resolved' as const, resolved_at: new Date().toISOString() } : a))
    )
  }

  const bySeverity = {
    critical: alertas.filter(a => a.severidad === 'critical' && a.estado !== 'resolved'),
    high: alertas.filter(a => a.severidad === 'high' && a.estado !== 'resolved'),
    medium: alertas.filter(a => a.severidad === 'medium' && a.estado !== 'resolved'),
    low: alertas.filter(a => a.severidad === 'low' && a.estado !== 'resolved'),
  }

  return (
    <div className="space-y-8">
      {/* Count badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        {(
          [
            { key: 'critical', label: 'Críticas', dot: 'bg-[#F7415C]' },
            { key: 'high',     label: 'Altas',    dot: 'bg-[#d4820a]' },
            { key: 'medium',   label: 'Medias',   dot: 'bg-[#f5c842]' },
            { key: 'low',      label: 'Bajas',    dot: 'bg-[#1a4fa0]' },
          ] as const
        ).map(({ key, label, dot }) => (
          <div key={key} className="bg-white p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">
                {label}
              </span>
            </div>
            <span className="font-display text-3xl font-bold">
              {bySeverity[key].length}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e8e8e8]">
        <div className="px-6 py-4 border-b border-[#e8e8e8]">
          <h3 className="font-display text-base font-bold">Alertas activas</h3>
          <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mt-0.5">
            pendientes y en revisión
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e8e8]">
                {['', 'Cliente', 'Alerta', 'Tipo', 'Tiempo', 'Estado', 'Acción'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-mono text-[8px] tracking-[2px] uppercase text-[#888888]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center font-mono text-[10px] text-[#888888]"
                  >
                    No hay alertas activas
                  </td>
                </tr>
              ) : (
                alertas
                  .filter(a => a.estado !== 'resolved')
                  .sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 }
                    return (order[a.severidad] ?? 4) - (order[b.severidad] ?? 4)
                  })
                  .map(alerta => (
                    <AlertRow key={alerta.id} alerta={alerta} onResolved={handleResolved} />
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
