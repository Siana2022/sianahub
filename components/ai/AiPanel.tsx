'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, X, ChevronRight } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  clienteId: string
  clienteName: string
  currentTab: string
}

export default function AiPanel({ clienteId, clienteName, currentTab }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const systemContext = `Eres el asistente de análisis de Siana Digital, una agencia de marketing digital.
Estás analizando el cliente "${clienteName}" (ID: ${clienteId}).
El usuario está actualmente en la pestaña "${currentTab}".

Ayuda al equipo a interpretar métricas de marketing digital, identificar problemas, sugerir optimizaciones y responder preguntas sobre GA4, Google Search Console, Meta Ads y Google Ads.
Sé conciso y directo. Usa listas cuando sea útil. No repitas información obvia.
Responde siempre en español.`

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemContext,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(m => [...m, { role: 'assistant', content: data.text }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Error al conectar con la IA. Inténtalo de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-10 shrink-0 bg-[#000000] flex flex-col items-center justify-center gap-2 border-l border-[#e8e8e8] hover:bg-[#F7415C] transition-colors group"
      >
        <Bot className="w-4 h-4 text-white/40 group-hover:text-white" />
        <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white rotate-180" />
      </button>
    )
  }

  return (
    <div className="w-80 shrink-0 flex flex-col bg-white border-l border-[#e8e8e8]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#000000] shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-[#F7415C]" />
          <span className="font-mono text-[10px] tracking-[2px] uppercase text-white">IA Siana</span>
        </div>
        <button onClick={() => setCollapsed(true)} className="text-white/30 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center pt-6 space-y-3">
            <Bot className="w-8 h-8 text-[#e8e8e8] mx-auto" />
            <p className="font-mono text-[10px] tracking-wide text-[#888888] uppercase">Analizando {clienteName}</p>
            <div className="space-y-1.5 text-left">
              {[
                '¿Cómo están las sesiones este mes?',
                '¿Cuáles son las keywords más rentables?',
                '¿Qué canales traen más conversiones?',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="w-full text-left text-xs text-[#555555] px-3 py-2 border border-[#e8e8e8] hover:border-[#000000] hover:text-[#000000] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-[#000000] text-white'
                : 'bg-[#f5f5f5] text-[#000000] border border-[#e8e8e8]'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#f5f5f5] border border-[#e8e8e8] px-3 py-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#e8e8e8] p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Pregunta sobre este cliente..."
          className="flex-1 text-xs px-3 py-2 border border-[#e8e8e8] focus:outline-none focus:border-[#000000] text-[#000000] placeholder-[#888888] transition-colors"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-[#000000] text-white hover:bg-[#F7415C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
