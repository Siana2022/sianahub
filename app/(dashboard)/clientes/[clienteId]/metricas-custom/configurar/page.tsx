'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Plus, Loader2 } from 'lucide-react'

interface Definition {
  id: string
  nombre_visible: string
  event_name: string
  grupo: string | null
  orden: number
}

export default function ConfigurarMetricasPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [nombre,      setNombre]      = useState('')
  const [evento,      setEvento]      = useState('')
  const [grupo,       setGrupo]       = useState('')

  useEffect(() => {
    fetch(`/api/clientes/${clienteId}/metricas-custom`)
      .then(r => r.json())
      .then(d => setDefinitions(d.definitions ?? []))
      .finally(() => setLoading(false))
  }, [clienteId])

  async function handleAdd() {
    if (!nombre.trim() || !evento.trim()) return
    setSaving(true)
    const res = await fetch(`/api/clientes/${clienteId}/metricas-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_visible: nombre.trim(), event_name: evento.trim(), grupo: grupo.trim() || null, orden: definitions.length }),
    })
    const data = await res.json()
    setDefinitions(d => [...d, data])
    setNombre(''); setEvento(''); setGrupo('')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/clientes/${clienteId}/metricas-custom`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDefinitions(d => d.filter(x => x.id !== id))
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-[#000000]">
        <Link href={`/clientes/${clienteId}/metricas-custom`} className="text-[#888888] hover:text-[#000000] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold">Configurar métricas</h2>
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mt-1">eventos GA4 personalizados</p>
        </div>
      </div>

      {/* Add new */}
      <div className="bg-white border border-[#e8e8e8] p-6 space-y-4">
        <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">Nueva métrica</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] block mb-1">Nombre visible</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Solicitudes demo"
              className="w-full border border-[#e8e8e8] px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#000000]" />
          </div>
          <div>
            <label className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] block mb-1">Nombre evento GA4</label>
            <input value={evento} onChange={e => setEvento(e.target.value)} placeholder="Ej: solicitud_demo"
              className="w-full border border-[#e8e8e8] px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#000000]" />
          </div>
        </div>
        <div>
          <label className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] block mb-1">Grupo (opcional)</label>
          <input value={grupo} onChange={e => setGrupo(e.target.value)} placeholder="Ej: Conversiones, Engagement..."
            className="w-full border border-[#e8e8e8] px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#000000]" />
        </div>
        <button onClick={handleAdd} disabled={saving || !nombre.trim() || !evento.trim()}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-4 py-2 hover:bg-[#F7415C] disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Añadir métrica
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-[#888888]" />
          <span className="font-mono text-[10px] text-[#888888]">Cargando...</span>
        </div>
      ) : definitions.length === 0 ? (
        <p className="font-mono text-[10px] text-[#888888]">No hay métricas configuradas todavía.</p>
      ) : (
        <div className="space-y-2">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">Métricas activas</p>
          {definitions.map(def => (
            <div key={def.id} className="bg-white border border-[#e8e8e8] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-bold text-[#000000]">{def.nombre_visible}</p>
                <p className="font-mono text-[9px] text-[#888888]">{def.event_name}{def.grupo ? ` · ${def.grupo}` : ''}</p>
              </div>
              <button onClick={() => handleDelete(def.id)} className="text-[#888888] hover:text-[#F7415C] transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
