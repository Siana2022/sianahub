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
  { value: 'ga4_event',        label: 'Evento GA4' },
  { value: 'gads_spend',       label: 'Inversión Google Ads' },
  { value: 'meta_spend',       label: 'Inversión Meta' },
  { value: 'ga4_sessions',     label: 'Sesiones GA4' },
  { value: 'ga4_conversions',  label: 'Conversiones GA4' },
] as const

type SourceType = typeof SOURCES[number]['value']

type SimpleFormula = {
  leftSrc: SourceType; leftEvent: string
  op: '+' | '-' | '*' | '/'
  rightSrc: SourceType; rightEvent: string
}

function buildFormulaNode(f: SimpleFormula): FormulaNode {
  const left: FormulaNode  = f.leftSrc  === 'ga4_event' ? { src: 'ga4_event', event: f.leftEvent  } : { src: f.leftSrc  as Exclude<SourceType, 'ga4_event'> }
  const right: FormulaNode = f.rightSrc === 'ga4_event' ? { src: 'ga4_event', event: f.rightEvent } : { src: f.rightSrc as Exclude<SourceType, 'ga4_event'> }
  return { op: f.op, left, right }
}

function extractSimpleFormula(node?: FormulaNode): SimpleFormula {
  const d: SimpleFormula = { leftSrc: 'gads_spend', leftEvent: '', op: '/', rightSrc: 'ga4_event', rightEvent: '' }
  if (!node || !('op' in node)) return d
  const l = node.left, r = node.right
  if ('op' in l || 'op' in r) return d
  return {
    leftSrc:    l.src as SourceType,
    leftEvent:  l.src === 'ga4_event' ? l.event : '',
    op:         node.op,
    rightSrc:   r.src as SourceType,
    rightEvent: r.src === 'ga4_event' ? r.event : '',
  }
}

const inputCls = "w-full bg-white border border-[#e8e8e8] px-3 py-2 text-sm text-[#000000] placeholder-[#888888] focus:outline-none focus:border-[#000000] transition-colors"
const labelCls = "block font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-1.5"

export default function MetricaFormModal({ initial, onSave, onClose }: Props) {
  const [nombre,  setNombre]  = useState(initial?.nombre_visible ?? '')
  const [grupo,   setGrupo]   = useState(initial?.grupo ?? '')
  const [tipo,    setTipo]    = useState<'event_count' | 'formula'>(initial?.tipo ?? 'event_count')
  const [event,   setEvent]   = useState(initial?.tipo === 'event_count' ? (initial.event_name ?? '') : '')
  const [unidad,  setUnidad]  = useState<MetricDefinition['unidad']>(initial?.unidad ?? 'count')
  const [invertir, setInvertir] = useState(initial?.invertir_colores ?? false)
  const [formula, setFormula] = useState<SimpleFormula>(
    initial?.tipo === 'formula' ? extractSimpleFormula(initial.formula) : extractSimpleFormula()
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
      onSave({ ...base, tipo: 'event_count', event_name: event.trim() })
    } else {
      onSave({ ...base, tipo: 'formula', formula: buildFormulaNode(formula) })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/50">
      <div className="bg-[#ffffff] border border-[#e8e8e8] w-full max-w-lg mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8] bg-[#000000]">
          <p className="font-display text-base font-bold text-white">
            {initial ? 'Editar métrica' : 'Nueva métrica'}
          </p>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre visible</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="ej. CPL Salas" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Grupo</label>
              <input value={grupo} onChange={e => setGrupo(e.target.value)} placeholder="ej. Salas" className={inputCls} />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className={labelCls}>Tipo de métrica</label>
            <div className="flex gap-0 border border-[#e8e8e8]">
              {(['event_count', 'formula'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                    tipo === t ? 'bg-[#000000] text-white' : 'bg-white text-[#888888] hover:text-[#000000]'
                  }`}
                >
                  {t === 'event_count' ? 'Evento GA4' : 'Fórmula'}
                </button>
              ))}
            </div>
          </div>

          {tipo === 'event_count' && (
            <div>
              <label className={labelCls}>Nombre del evento GA4</label>
              <input value={event} onChange={e => setEvent(e.target.value)} placeholder="ej. lead_sala_padel" className={`${inputCls} font-mono`} />
            </div>
          )}

          {tipo === 'formula' && (
            <div className="bg-white border border-[#e8e8e8] p-4 space-y-4">
              <p className={labelCls}>Fórmula: A operación B</p>
              <div>
                <label className={labelCls}>A — lado izquierdo</label>
                <select value={formula.leftSrc} onChange={e => setFormula(f => ({ ...f, leftSrc: e.target.value as SourceType }))} className={inputCls}>
                  {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {formula.leftSrc === 'ga4_event' && (
                  <input value={formula.leftEvent} onChange={e => setFormula(f => ({ ...f, leftEvent: e.target.value }))}
                    placeholder="nombre del evento" className={`${inputCls} mt-1 font-mono text-xs`} />
                )}
              </div>
              <div>
                <label className={labelCls}>Operación</label>
                <div className="flex gap-0 border border-[#e8e8e8]">
                  {(['+', '-', '*', '/'] as const).map(op => (
                    <button key={op} onClick={() => setFormula(f => ({ ...f, op }))}
                      className={`flex-1 py-2 font-mono text-sm font-bold transition-colors ${
                        formula.op === op ? 'bg-[#F7415C] text-white' : 'bg-white text-[#555555] hover:bg-[#ffffff]'
                      }`}>{op}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>B — lado derecho</label>
                <select value={formula.rightSrc} onChange={e => setFormula(f => ({ ...f, rightSrc: e.target.value as SourceType }))} className={inputCls}>
                  {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {formula.rightSrc === 'ga4_event' && (
                  <input value={formula.rightEvent} onChange={e => setFormula(f => ({ ...f, rightEvent: e.target.value }))}
                    placeholder="nombre del evento" className={`${inputCls} mt-1 font-mono text-xs`} />
                )}
              </div>
              <div className="border border-[#e8e8e8] bg-[#ffffff] px-3 py-2">
                <p className="font-mono text-[9px] uppercase tracking-wide text-[#888888] mb-1">Vista previa</p>
                <p className="font-mono text-xs text-[#F7415C]">{formulaToString(buildFormulaNode(formula))}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Unidad</label>
              <select value={unidad} onChange={e => setUnidad(e.target.value as MetricDefinition['unidad'])} className={inputCls}>
                <option value="count">Número (Nº)</option>
                <option value="eur">Euro (€)</option>
                <option value="pct">Porcentaje (%)</option>
                <option value="x">Multiplicador (x)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Colores delta</label>
              <button onClick={() => setInvertir(v => !v)}
                className={`w-full py-2 font-mono text-[10px] uppercase tracking-wide border transition-colors ${
                  invertir ? 'bg-[#fff0f2] border-[#F7415C] text-[#F7415C]' : 'bg-white border-[#e8e8e8] text-[#888888] hover:border-[#000000]'
                }`}>
                {invertir ? 'Invertido (↓ = mejor)' : 'Normal (↑ = mejor)'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e8e8e8] bg-white">
          <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] px-4 py-2 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!nombre.trim() || !grupo.trim()}
            className="font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-5 py-2 hover:bg-[#F7415C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
