import { getDays } from './metricas'

// ── Types ──────────────────────────────────────────────────────────────────────

export type FormulaNode =
  | { src: 'ga4_event'; event: string }
  | { src: 'gads_spend' }
  | { src: 'meta_spend' }
  | { src: 'ga4_sessions' }
  | { src: 'ga4_conversions' }
  | { op: '+' | '-' | '*' | '/'; left: FormulaNode; right: FormulaNode }

export type MetricDefinition = {
  id: string
  nombre_visible: string
  grupo: string
  orden: number
  activa: boolean
  unidad: 'count' | 'eur' | 'pct' | 'x'
  invertir_colores: boolean
} & (
  | { tipo: 'event_count'; event_name: string; formula?: never }
  | { tipo: 'formula'; formula: FormulaNode; event_name?: never }
)

export type MetricData = {
  id: string
  definition_id: string
  fecha: string
  valor: number
}

// ── Seeded random (deterministic per metric) ───────────────────────────────────

function seeded(base: number, day: number, seed: number = 1) {
  const factor = 1 + Math.sin(day * 2.1 + seed) * 0.3
  return Math.max(0, Math.round(base * factor))
}

// ── Mock definitions ───────────────────────────────────────────────────────────

export function mockCustomDefinitions(): MetricDefinition[] {
  return [
    // Salas
    {
      id: 'def-1',
      tipo: 'event_count',
      event_name: 'lead_sala_padel',
      nombre_visible: 'Leads Sala Pádel',
      grupo: 'Salas',
      orden: 1,
      activa: true,
      unidad: 'count',
      invertir_colores: false,
    },
    {
      id: 'def-2',
      tipo: 'event_count',
      event_name: 'lead_sala_yoga',
      nombre_visible: 'Leads Sala Yoga',
      grupo: 'Salas',
      orden: 2,
      activa: true,
      unidad: 'count',
      invertir_colores: false,
    },
    {
      id: 'def-3',
      tipo: 'formula',
      formula: {
        op: '/',
        left: { src: 'gads_spend' },
        right: {
          op: '+',
          left: { src: 'ga4_event', event: 'lead_sala_padel' },
          right: { src: 'ga4_event', event: 'lead_sala_yoga' },
        },
      },
      nombre_visible: 'CPL Salas',
      grupo: 'Salas',
      orden: 3,
      activa: true,
      unidad: 'eur',
      invertir_colores: true,
    },
    // Modalidad
    {
      id: 'def-4',
      tipo: 'event_count',
      event_name: 'lead_bono_mensual',
      nombre_visible: 'Leads Bono Mensual',
      grupo: 'Modalidad',
      orden: 1,
      activa: true,
      unidad: 'count',
      invertir_colores: false,
    },
    {
      id: 'def-5',
      tipo: 'event_count',
      event_name: 'lead_clase_suelta',
      nombre_visible: 'Leads Clase Suelta',
      grupo: 'Modalidad',
      orden: 2,
      activa: true,
      unidad: 'count',
      invertir_colores: false,
    },
    {
      id: 'def-6',
      tipo: 'formula',
      formula: {
        op: '/',
        left: { src: 'ga4_event', event: 'lead_bono_mensual' },
        right: { src: 'ga4_sessions' },
      },
      nombre_visible: 'Conv. Bono/Sesión',
      grupo: 'Modalidad',
      orden: 3,
      activa: true,
      unidad: 'pct',
      invertir_colores: false,
    },
    // Global
    {
      id: 'def-7',
      tipo: 'formula',
      formula: {
        op: '/',
        left: { op: '+', left: { src: 'gads_spend' }, right: { src: 'meta_spend' } },
        right: { src: 'ga4_conversions' },
      },
      nombre_visible: 'CPL Total',
      grupo: 'Global',
      orden: 1,
      activa: true,
      unidad: 'eur',
      invertir_colores: true,
    },
    {
      id: 'def-8',
      tipo: 'formula',
      formula: {
        op: '+',
        left: { src: 'gads_spend' },
        right: { src: 'meta_spend' },
      },
      nombre_visible: 'Inversión Total',
      grupo: 'Global',
      orden: 2,
      activa: true,
      unidad: 'eur',
      invertir_colores: true,
    },
  ]
}

// ── Mock daily values per definition ──────────────────────────────────────────

export function mockCustomDaily(definitionId: string): MetricData[] {
  const seedMap: Record<string, { base: number; seed: number }> = {
    'def-1': { base: 14, seed: 1 },
    'def-2': { base: 9, seed: 2 },
    'def-3': { base: 22, seed: 3 },
    'def-4': { base: 18, seed: 4 },
    'def-5': { base: 11, seed: 5 },
    'def-6': { base: 3, seed: 6 },
    'def-7': { base: 19, seed: 7 },
    'def-8': { base: 850, seed: 8 },
  }
  const cfg = seedMap[definitionId] ?? { base: 10, seed: 1 }
  return getDays(30).map((fecha, i) => ({
    id: `${definitionId}-${i}`,
    definition_id: definitionId,
    fecha,
    valor: seeded(cfg.base, i, cfg.seed),
  }))
}

// ── Resolved metric (current period vs prev) ───────────────────────────────────

export type ResolvedMetric = {
  definition: MetricDefinition
  current: number
  prev: number
  daily: { fecha: string; valor: number }[]
}

export function mockResolvedMetrics(): ResolvedMetric[] {
  return mockCustomDefinitions()
    .filter(d => d.activa)
    .map(def => {
      const daily = mockCustomDaily(def.id)
      const current = daily.slice(-30).reduce((s, d) => s + d.valor, 0)
      const prevBase = def.tipo === 'formula' && def.formula
        ? Math.round(current * (0.85 + Math.random() * 0.3))
        : Math.round(current * (0.8 + Math.random() * 0.4))
      return { definition: def, current, prev: prevBase, daily }
    })
}

// ── Formula node to human-readable string ─────────────────────────────────────

export function formulaToString(node: FormulaNode): string {
  if ('op' in node) {
    const opSymbol = node.op === '*' ? '×' : node.op
    return `(${formulaToString(node.left)} ${opSymbol} ${formulaToString(node.right)})`
  }
  switch (node.src) {
    case 'ga4_event': return `GA4 "${node.event}"`
    case 'gads_spend': return 'Inversión Google Ads'
    case 'meta_spend': return 'Inversión Meta'
    case 'ga4_sessions': return 'Sesiones GA4'
    case 'ga4_conversions': return 'Conversiones GA4'
  }
}

// ── Format value by unit ───────────────────────────────────────────────────────

export function formatMetricValue(value: number, unidad: MetricDefinition['unidad']): string {
  switch (unidad) {
    case 'eur': return `€${value.toFixed(2)}`
    case 'pct': return `${value.toFixed(1)}%`
    case 'x': return `${value.toFixed(2)}x`
    default: return value.toLocaleString()
  }
}
