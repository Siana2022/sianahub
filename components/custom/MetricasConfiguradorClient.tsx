'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import type { MetricDefinition, FormulaNode } from '@/lib/mock/custom'
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
    setDefinitions(prev =>
      prev.map(d => (d.id === id ? { ...d, activa: !d.activa } : d))
    )
  }

  function remove(id: string) {
    setDefinitions(prev => prev.filter(d => d.id !== id))
  }

  function save(def: MetricDefinition) {
    setDefinitions(prev => {
      const idx = prev.findIndex(d => d.id === def.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = def
        return next
      }
      return [...prev, def]
    })
    setEditing(null)
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      {/* Group list */}
      {groups.map(grupo => {
        const items = definitions.filter(d => d.grupo === grupo).sort((a, b) => a.orden - b.orden)
        return (
          <div key={grupo} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/40">
              <h3 className="text-sm font-medium text-white">{grupo}</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {items.map(def => (
                <div
                  key={def.id}
                  className={`flex items-center gap-3 px-4 py-3 ${!def.activa ? 'opacity-40' : ''}`}
                >
                  <GripVertical size={14} className="text-gray-600 shrink-0 cursor-grab" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{def.nombre_visible}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                        {UNIDAD_LABELS[def.unidad]}
                      </span>
                      {def.tipo === 'formula' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                          fórmula
                        </span>
                      )}
                      {def.tipo === 'event_count' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          evento
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {def.tipo === 'formula' && def.formula
                        ? formulaToString(def.formula)
                        : `GA4: ${def.event_name}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(def.id)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        def.activa
                          ? 'border-green-700 text-green-400 hover:border-green-500'
                          : 'border-gray-700 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {def.activa ? 'Activa' : 'Inactiva'}
                    </button>
                    <button
                      onClick={() => setEditing(def)}
                      className="p-1.5 text-gray-500 hover:text-white transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => remove(def.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Add button */}
      <button
        onClick={() => setCreating(true)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-dashed border-gray-700 hover:border-gray-500 w-full justify-center py-3 rounded-lg transition-colors"
      >
        <Plus size={14} />
        Añadir métrica
      </button>

      {/* Modal */}
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
