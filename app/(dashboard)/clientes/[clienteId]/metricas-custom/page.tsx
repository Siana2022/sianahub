'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Settings, Loader2, Plus } from 'lucide-react'
import LineChart from '@/components/charts/LineChart'

interface Definition {
  id: string
  nombre_visible: string
  event_name: string
  grupo: string | null
}

interface DailyValue { fecha: string; valor: number }

export default function MetricasCustomPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [daily,       setDaily]       = useState<Record<string, DailyValue[]>>({})
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    fetch(`/api/clientes/${clienteId}/metricas-custom`)
      .then(r => r.json())
      .then(d => {
        setDefinitions(d.definitions ?? [])
        setDaily(d.daily ?? {})
      })
      .finally(() => setLoading(false))
  }, [clienteId])

  // Group definitions by grupo
  const groups: Record<string, Definition[]> = {}
  for (const def of definitions) {
    const g = def.grupo ?? 'Sin grupo'
    if (!groups[g]) groups[g] = []
    groups[g].push(def)
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-[#888888]" />
      <span className="font-mono text-[10px] text-[#888888]">Cargando métricas...</span>
    </div>
  )

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-end justify-between pb-4 border-b-2 border-[#000000]">
        <div>
          <h2 className="font-display text-2xl font-bold">Custom</h2>
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mt-1">métricas personalizadas</p>
        </div>
        <Link
          href={`/clientes/${clienteId}/metricas-custom/configurar`}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] border border-[#e8e8e8] hover:border-[#000000] px-3 py-2 transition-colors"
        >
          <Settings className="w-3 h-3" />
          Configurar
        </Link>
      </div>

      {definitions.length === 0 ? (
        <div className="border border-dashed border-[#e8e8e8] p-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wide text-[#888888] mb-3">
            No hay métricas configuradas para este cliente
          </p>
          <Link
            href={`/clientes/${clienteId}/metricas-custom/configurar`}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-4 py-2 hover:bg-[#F7415C] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Añadir primera métrica
          </Link>
        </div>
      ) : (
        Object.entries(groups).map(([grupo, defs]) => (
          <div key={grupo} className="space-y-4">
            <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] border-b border-[#e8e8e8] pb-2">
              {grupo}
            </p>
            {defs.map(def => {
              const values = daily[def.id] ?? []
              const total  = values.reduce((s, v) => s + v.valor, 0)
              const chartData = values.map(v => ({ fecha: v.fecha, valor: v.valor }))
              return (
                <div key={def.id} className="bg-white border border-[#e8e8e8] p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-base font-bold">{def.nombre_visible}</h3>
                      <p className="font-mono text-[9px] text-[#888888] mt-0.5">evento: {def.event_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold">{total.toLocaleString()}</p>
                      <p className="font-mono text-[9px] text-[#888888]">últimos 30 días</p>
                    </div>
                  </div>
                  {chartData.length > 0 && (
                    <LineChart
                      data={chartData}
                      series={[{ key: 'valor', label: def.nombre_visible, color: '#000000' }]}
                      height={120}
                      formatY={v => String(Math.round(v))}
                    />
                  )}
                  {chartData.length === 0 && (
                    <p className="font-mono text-[9px] text-[#888888]">Sin datos registrados aún. Los datos se ingestan con n8n.</p>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
