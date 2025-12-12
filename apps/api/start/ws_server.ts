import { WebSocketServer, type WebSocket } from 'ws'
import env from '#start/env'
import { realtimeBus } from '#services/realtime_bus'

type ClientMeta = {
  channels: Set<number>
}

const port = Number(env.get('WS_PORT') || 3334)
const wss = new WebSocketServer({ port })

const clients = new Map<WebSocket, ClientMeta>()

function safeJsonParse(message: string) {
  try {
    return JSON.parse(message)
  } catch {
    return null
  }
}

wss.on('connection', (ws) => {
  const meta: ClientMeta = { channels: new Set() }
  clients.set(ws, meta)

  ws.on('message', (raw) => {
    const payload = typeof raw === 'string' ? raw : raw.toString()
    const data = safeJsonParse(payload)
    if (!data || typeof data !== 'object') return
    const { type } = data as { type?: string }

    if (type === 'subscribe' && typeof data.channelId === 'number') {
      meta.channels.add(data.channelId)
      ws.send(JSON.stringify({ type: 'subscribed', channelId: data.channelId }))
      return
    }
    if (type === 'unsubscribe' && typeof data.channelId === 'number') {
      meta.channels.delete(data.channelId)
      ws.send(JSON.stringify({ type: 'unsubscribed', channelId: data.channelId }))
      return
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
  })
})

function broadcast(type: string, payload: Record<string, unknown>) {
  const channelId = payload.channelId
  const channelIdNum = typeof channelId === 'number' ? channelId : Number(channelId)
  clients.forEach((meta, ws) => {
    if (channelIdNum && !meta.channels.has(channelIdNum)) return
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type, data: payload }))
    }
  })
}

realtimeBus.on('message:new', (payload) => {
  broadcast('message:new', payload as unknown as Record<string, unknown>)
})

realtimeBus.on('typing', (payload) => {
  broadcast('typing', payload as unknown as Record<string, unknown>)
})

export { wss }

