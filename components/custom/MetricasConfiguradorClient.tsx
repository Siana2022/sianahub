'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import type { MetricDefinition } from '@/lib/mock/custom'
import { formulaToString } from '@/lib/mock/custom'
import MetricaFormModal from './MetricaFormModal'

type Props = {
  clienteId: string
  initialDefinitions: MetricDefinition[]
}

const UNIDAD_LABELS = { count: 'Nº', eur: '€', pct: '%', x: 'x' }

export default function MetricasConfiguradorClient({ clienteId, initialDefinitions }: Props) {
  const [definitions, setDefinitions] = useState<MetricDefinition[]>(initialDefinitions)
  const [editing, setEditing] = useState<MetricDefinition | null>(null)
  const [creating, setCreating] = useState(false)

  const groups = [...new Set(definitions.map(d => d.grupo))]

  function toggleActive(id: string) {
    setDefinitions(prev => prev.map(d => d.id === id ? { ...d, activa: !d.activa } : d))
  }

  function remove(id: string) {
    setDefinitions(prev => prev.filter(d => d.id !== id))
  }

  function save(def: MetricDefinition) {
    setDefinitions(prev => {
      const idx = prev.findIndex(d => d.id === def.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = def; return next }
      return [...prev, def]
    })
    setEditing(null)
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      {groups.map(grupo => {
        const items = definitions.filter(d => d.grupo === grupo).sort((a, b) => a.orden - b.orden)
        return (
          <div key={grupo} className="bg-white border border-[#e8e8e8] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#e8e8e8] bg-[#ffffff]">
              <h3 className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">{grupo}</h3>
            </div>
            <div className="divide-y divide-[#e8e8e8]">
              {items.map(def => (
                <div key={def.id} className={`flex items-center gap-3 px-5 py-3 ${!def.activa ? 'opacity-40' : ''}`}>
                  <GripVertical size={13} className="text-[#e8e8e8] shrink-0 cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-[#000000]">{def.nombre_visible}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#ffffff] text-[#888888] border border-[#e8e8e8]">
                        {UNIDAD_LABELS[def.unidad]}
                      </span>
                      {def.tipo === 'formula' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#fff0f2] text-[#F7415C]">fórmula</span>
                      )}
                      {def.tipo === 'event_count' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#edf2fc] text-[#1a4fa0]">evento</span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-[#888888] truncate">
                      {def.tipo === 'formula' && def.formula
                        ? formulaToString(def.formula)
                        : `GA4: ${def.event_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(def.id)}
                      className={`font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 border transition-colors ${
                        def.activa
                          ? 'border-[#1a7a4a] text-[#1a7a4a]'
                          : 'border-[#e8e8e8] text-[#888888]'
                      }`}
                    >
                      {def.activa ? 'Activa' : 'Inactiva'}
                    </button>
                    <button onClick={() => setEditing(def)} className="p-1 text-[#888888] hover:text-[#000000] transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(def.id)} className="p-1 text-[#888888] hover:text-[#F7415C] transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <button
        onClick={() => setCreating(true)}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[1.5px] text-[#888888] hover:text-[#000000] border border-dashed border-[#e8e8e8] hover:border-[#888888] w-full justify-center py-3 transition-colors"
      >
        <Plus size={13} />
        Añadir métrica
      </button>

      {(editing || creating) && (
        <MetricaFormModal
          initial={editing ?? undefined}
          onSave={save}
          onClose={() => { setEditing(null); setCreating(false) }}
        />
      )}
    </div>
  )
}
