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
          <div key={grupo} className="bg-white border border-[#e2dfd8] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#e2dfd8] bg-[#f7f5f0]">
              <h3 className="font-mono text-[9px] tracking-[2px] uppercase text-[#9a9a8e]">{grupo}</h3>
            </div>
            <div className="divide-y divide-[#e2dfd8]">
              {items.map(def => (
                <div key={def.id} className={`flex items-center gap-3 px-5 py-3 ${!def.activa ? 'opacity-40' : ''}`}>
                  <GripVertical size={13} className="text-[#e2dfd8] shrink-0 cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-[#1a1a18]">{def.nombre_visible}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#f7f5f0] text-[#9a9a8e] border border-[#e2dfd8]">
                        {UNIDAD_LABELS[def.unidad]}
                      </span>
                      {def.tipo === 'formula' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#fef0ed] text-[#e8321a]">fórmula</span>
                      )}
                      {def.tipo === 'event_count' && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#edf2fc] text-[#1a4fa0]">evento</span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-[#9a9a8e] truncate">
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
                          : 'border-[#e2dfd8] text-[#9a9a8e]'
                      }`}
                    >
                      {def.activa ? 'Activa' : 'Inactiva'}
                    </button>
                    <button onClick={() => setEditing(def)} className="p-1 text-[#9a9a8e] hover:text-[#1a1a18] transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(def.id)} className="p-1 text-[#9a9a8e] hover:text-[#e8321a] transition-colors">
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
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[1.5px] text-[#9a9a8e] hover:text-[#1a1a18] border border-dashed border-[#e2dfd8] hover:border-[#9a9a8e] w-full justify-center py-3 transition-colors"
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
