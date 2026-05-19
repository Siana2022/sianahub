import { fetchMetaSummary } from '@/lib/meta/ads'
import { fetchGA4SummaryRange } from '@/lib/google/ga4'
import { sendSlackMessage } from '@/lib/slack'
import type { MetaEventsConfig } from '@/types/cliente'

export interface AlertasConfig {
  cpl_max?:         number   // Alerta si CPL supera este valor
  leads_drop_pct?:  number   // Alerta si leads caen más de X% vs semana anterior
  sin_sesiones_h?:  number   // Horas sin sesiones GA4 antes de alertar (default 48)
}

export interface ClienteParaChequear {
  id:                  string
  nombre:              string
  slack_channel_id:    string | null
  alertas_activas:     boolean
  alertas_config:      AlertasConfig | null
  tipo_proyecto:       'leads' | 'ecommerce'
  meta_ad_account_id:  string | null
  meta_events_config:  MetaEventsConfig | null
  ga4_property_id:     string | null
}

export interface AlertaGenerada {
  cliente_id:  string
  tipo:        string
  severidad:   'low' | 'medium' | 'high' | 'critical'
  titulo:      string
  descripcion: string | null
  fuente:      string
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10) }

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// ── Slack message builder ──────────────────────────────────────────────────────

async function notificarSlack(
  channel: string,
  cliente: string,
  alertas: AlertaGenerada[]
) {
  if (!alertas.length) return

  const emoji = (s: string) => s === 'critical' ? '🔴' : s === 'high' ? '🟠' : '🟡'

  const lines = alertas.map(a =>
    `${emoji(a.severidad)} *${a.titulo}*${a.descripcion ? `\n  └ ${a.descripcion}` : ''}`
  ).join('\n\n')

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `⚠️ Alertas · ${cliente}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: lines },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_SianaHub · ${new Date().toLocaleDateString('es-ES')}_` }],
    },
  ]

  await sendSlackMessage(channel, `⚠️ Alertas · ${cliente}`, blocks)
}

// ── Main checker ───────────────────────────────────────────────────────────────

export async function checkCliente(
  cliente: ClienteParaChequear
): Promise<AlertaGenerada[]> {
  const alertas: AlertaGenerada[] = []
  const cfg = cliente.alertas_config ?? {}

  // ── Meta: CPL y leads ────────────────────────────────────────────────────────
  if (cliente.meta_ad_account_id) {
    try {
      const accountId = cliente.meta_ad_account_id.replace(/^act_/, '')
      const since     = daysAgo(30)
      const until     = today()

      const summary = await fetchMetaSummary(
        accountId,
        cliente.meta_events_config ?? undefined,
        { since, until }
      )

      // CPL > umbral
      if (cfg.cpl_max && summary.cpl > cfg.cpl_max) {
        alertas.push({
          cliente_id:  cliente.id,
          tipo:        'cpl_alto',
          severidad:   summary.cpl > cfg.cpl_max * 1.5 ? 'critical' : 'high',
          titulo:      `CPL alto: €${summary.cpl.toFixed(2)} (máx €${cfg.cpl_max})`,
          descripcion: `Spend: €${summary.spend.toFixed(0)} · Leads: ${summary.conversions}`,
          fuente:      'meta',
        })
      }

      // Leads caída vs periodo anterior
      const dropPct = cfg.leads_drop_pct ?? 30
      if (summary.conversions_prev > 0 && summary.conversions < summary.conversions_prev) {
        const caida = ((summary.conversions_prev - summary.conversions) / summary.conversions_prev) * 100
        if (caida >= dropPct) {
          alertas.push({
            cliente_id:  cliente.id,
            tipo:        'leads_caida',
            severidad:   caida >= 50 ? 'critical' : 'high',
            titulo:      `Leads cayeron ${caida.toFixed(0)}% vs periodo anterior`,
            descripcion: `Ahora: ${summary.conversions} · Antes: ${summary.conversions_prev}`,
            fuente:      'meta',
          })
        }
      }

      // Sin gasto (campañas paradas)
      if (summary.spend === 0) {
        alertas.push({
          cliente_id:  cliente.id,
          tipo:        'sin_gasto_meta',
          severidad:   'high',
          titulo:      'Meta Ads sin gasto en los últimos 30 días',
          descripcion: 'Puede que todas las campañas estén pausadas o el presupuesto agotado.',
          fuente:      'meta',
        })
      }
    } catch (_e) {
      // Meta no disponible — no alertar por error de API
    }
  }

  // ── GA4: sin sesiones ────────────────────────────────────────────────────────
  if (cliente.ga4_property_id) {
    try {
      const propertyId = cliente.ga4_property_id.startsWith('properties/')
        ? cliente.ga4_property_id
        : `properties/${cliente.ga4_property_id}`

      const horas   = cfg.sin_sesiones_h ?? 48
      const daysNum = Math.ceil(horas / 24)
      const since   = daysAgo(daysNum)
      const until   = today()

      const ga4 = await fetchGA4SummaryRange(propertyId, since, until)

      if (ga4.sessions === 0) {
        alertas.push({
          cliente_id:  cliente.id,
          tipo:        'ga4_sin_sesiones',
          severidad:   'critical',
          titulo:      `GA4 sin sesiones en las últimas ${horas}h`,
          descripcion: 'Posible problema de tracking: GA4 no está recibiendo datos.',
          fuente:      'ga4',
        })
      }
    } catch (_e) {
      // GA4 no disponible
    }
  }

  return alertas
}

// ── Runner: chequea todos los clientes y notifica ─────────────────────────────

export async function runChecks(
  clientes: ClienteParaChequear[],
  saveAlerta: (a: AlertaGenerada) => Promise<void>
): Promise<{ cliente: string; alertas: number }[]> {
  const resultados = []

  for (const cliente of clientes) {
    if (!cliente.alertas_activas) continue

    const alertas = await checkCliente(cliente)

    // Save each alert to DB
    for (const alerta of alertas) {
      await saveAlerta(alerta).catch(console.error)
    }

    // Send Slack to client channel if configured
    if (cliente.slack_channel_id && alertas.length > 0) {
      await notificarSlack(cliente.slack_channel_id, cliente.nombre, alertas).catch(console.error)
    }

    resultados.push({ cliente: cliente.nombre, alertas: alertas.length })
  }

  return resultados
}
