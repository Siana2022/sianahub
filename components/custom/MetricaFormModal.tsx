'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { MetricDefinition, FormulaNode } from '@/lib/mock/custom'
import { formulaToString } from '@/lib/mock/custom'

type Props = {
  initial?: MetricDefinition
  onSave: (def: MetricDefinition) => void
  onClose: () => void
}

const SOURCES = [
  { value: 'ga4_event', label: 'Evento GA4' },
  { value: 'gads_spend', label: 'Inversión Google Ads' },
  { value: 'meta_spend', label: 'Inversión Meta' },
  { value: 'ga4_sessions', label: 'Sesiones GA4' },
  { value: 'ga4_conversions', label: 'Conversiones GA4' },
] as const

type SourceType = typeof SOURCES[number]['value']

type SimpleFormula = {
  leftSrc: SourceType
  leftEvent: string
  op: '+' | '-' | '*' | '/'
  rightSrc: SourceType
  rightEvent: string
}

function buildFormulaNode(f: SimpleFormula): FormulaNode {
  const left: FormulaNode =
    f.leftSrc === 'ga4_event'
      ? { src: 'ga4_event', event: f.leftEvent }
      : { src: f.leftSrc as Exclude<SourceType, 'ga4_event'> }

  const right: FormulaNode =
    f.rightSrc === 'ga4_event'
      ? { src: 'ga4_event', event: f.rightEvent }
      : { src: f.rightSrc as Exclude<SourceType, 'ga4_event'> }

  return { op: f.op, left, right }
}

function extractSimpleFormula(node: FormulaNode | undefined): SimpleFormula {
  const defaults: SimpleFormula = {
    leftSrc: 'gads_spend',
    leftEvent: '',
    op: '/',
    rightSrc: 'ga4_event',
    rightEvent: '',
  }
  if (!node || !('op' in node)) return defaults
  const left = node.left
  const right = node.right
  if ('op' in left || 'op' in right) return defaults // nested — not editable as simple
  return {
    leftSrc: left.src as SourceType,
    leftEvent: left.src === 'ga4_event' ? left.event : '',
    op: node.op,
    rightSrc: right.src as SourceType,
    rightEvent: right.src === 'ga4_event' ? right.event : '',
  }
}

export default function MetricaFormModal({ initial, onSave, onClose }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre_visible ?? '')
  const [grupo, setGrupo] = useState(initial?.grupo ?? '')
  const [tipo, setTipo] = useState<'event_count' | 'formula'>(initial?.tipo ?? 'event_count')
  const [eventName, setEventName] = useState(
    initial?.tipo === 'event_count' ? (initial.event_name ?? '') : ''
  )
  const [unidad, setUnidad] = useState<MetricDefinition['unidad']>(initial?.unidad ?? 'count')
  const [invertir, setInvertir] = useState(initial?.invertir_colores ?? false)
  const [formula, setFormula] = useState<SimpleFormula>(
    initial?.tipo === 'formula' ? extractSimpleFormula(initial.formula) : extractSimpleFormula(undefined)
  )

  function handleSave() {
    if (!nombre.trim() || !grupo.trim()) return

    const base = {
      id: initial?.id ?? `def-${Date.now()}`,
      nombre_visible: nombre.trim(),
      grupo: grupo.trim(),
      orden: initial?.orden ?? 99,
      activa: initial?.activa ?? true,
      unidad,
      invertir_colores: invertir,
    }

    if (tipo === 'event_count') {
      onSave({ ...base, tipo: 'event_count', event_name: eventName.trim() })
    } else {
      onSave({ ...base, tipo: 'formula', formula: buildFormulaNode(formula) })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-sm">
            {initial ? 'Editar métrica' : 'Nueva métrica'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre visible</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="ej. CPL Salas"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Grupo */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Grupo</label>
            <input
              value={grupo}
              onChange={e => setGrupo(e.target.value)}
              placeholder="ej. Salas, Modalidad, Global"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Tipo de métrica</label>
            <div className="flex gap-2">
              {(['event_count', 'formula'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium border transition-colors ${
                    tipo === t
                      ? 'bg-gray-700 border-gray-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {t === 'event_count' ? 'Evento GA4' : 'Fórmula'}
                </button>
              ))}
            </div>
          </div>

          {/* Event count config */}
          {tipo === 'event_count' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del evento GA4</label>
              <input
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="ej. lead_sala_padel"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 font-mono"
              />
            </div>
          )}

          {/* Formula builder */}
          {tipo === 'formula' && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <p className="text-xs text-gray-400 font-medium">Fórmula: A operación B</p>

              {/* Left operand */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">A (lado izquierdo)</label>
                <select
                  value={formula.leftSrc}
                  onChange={e => setFormula(f => ({ ...f, leftSrc: e.target.value as SourceType }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {formula.leftSrc === 'ga4_event' && (
                  <input
                    value={formula.leftEvent}
                    onChange={e => setFormula(f => ({ ...f, leftEvent: e.target.value }))}
                    placeholder="nombre del evento"
                    className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                )}
              </div>

              {/* Operator */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Operación</label>
                <div className="flex gap-1">
                  {(['+', '-', '*', '/'] as const).map(op => (
                    <button
                      key={op}
                      onClick={() => setFormula(f => ({ ...f, op }))}
                      className={`flex-1 py-1.5 rounded text-sm font-mono font-bold border transition-colors ${
                        formula.op === op
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right operand */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">B (lado derecho)</label>
                <select
                  value={formula.rightSrc}
                  onChange={e => setFormula(f => ({ ...f, rightSrc: e.target.value as SourceType }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {formula.rightSrc === 'ga4_event' && (
                  <input
                    value={formula.rightEvent}
                    onChange={e => setFormula(f => ({ ...f, rightEvent: e.target.value }))}
                    placeholder="nombre del evento"
                    className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                )}
              </div>

              {/* Preview */}
              <div className="border border-gray-700 rounded px-3 py-2 bg-gray-900">
                <p className="text-[10px] text-gray-500 mb-0.5">Vista previa</p>
                <p className="text-xs text-purple-300 font-mono">
                  {formulaToString(buildFormulaNode(formula))}
                </p>
              </div>
            </div>
          )}

          {/* Unit + invert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unidad</label>
              <select
                value={unidad}
                onChange={e => setUnidad(e.target.value as MetricDefinition['unidad'])}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-2 text-sm text-white focus:outline-none"
              >
                <option value="count">Número (Nº)</option>
                <option value="eur">Euro (€)</option>
                <option value="pct">Porcentaje (%)</option>
                <option value="x">Multiplicador (x)</option>
              </select>
            </div>
            <div className="flex flex-col justify-between">
              <label className="block text-xs text-gray-400 mb-1">Colores</label>
              <button
                onClick={() => setInvertir(v => !v)}
                className={`py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                  invertir
                    ? 'bg-orange-500/20 border-orange-600 text-orange-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {invertir ? 'Invertido (menos = mejor)' : 'Normal (más = mejor)'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nombre.trim() || !grupo.trim()}
            className="px-4 py-2 text-sm bg-white text-gray-900 font-medium rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
