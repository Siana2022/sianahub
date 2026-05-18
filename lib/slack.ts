const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_ALERTAS_CHANNEL = process.env.SLACK_ALERTAS_CHANNEL ?? '#alertas'

export async function sendSlackMessage(
  channel: string,
  text: string,
  blocks?: object[]
): Promise<void> {
  if (!SLACK_BOT_TOKEN) return

  const body: Record<string, unknown> = { channel, text }
  if (blocks) body.blocks = blocks

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Slack API error: ${err}`)
  }

  const json = await res.json()
  if (!json.ok) {
    throw new Error(`Slack API error: ${json.error}`)
  }
}

const SEVERITY_EMOJI: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
}

export async function sendAlertToSlack(alerta: {
  titulo: string
  descripcion: string | null
  severidad: string
  cliente_nombre: string
  tipo: string
}): Promise<void> {
  if (!SLACK_BOT_TOKEN) return

  const emoji = SEVERITY_EMOJI[alerta.severidad] ?? '⚪'
  const severidadLabel = alerta.severidad.toUpperCase()

  const text = `${emoji} *[${severidadLabel}]* ${alerta.titulo} — ${alerta.cliente_nombre}`

  const blocks: object[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${alerta.titulo}*`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Cliente:*\n${alerta.cliente_nombre}` },
        { type: 'mrkdwn', text: `*Severidad:*\n${severidadLabel}` },
        { type: 'mrkdwn', text: `*Tipo:*\n${alerta.tipo}` },
      ],
    },
  ]

  if (alerta.descripcion) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Descripción:*\n${alerta.descripcion}`,
      },
    })
  }

  await sendSlackMessage(SLACK_ALERTAS_CHANNEL, text, blocks)
}
