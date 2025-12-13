import { WebSocketServer, type WebSocket } from 'ws'
import env from '#start/env'
import { realtimeBus } from '#services/realtime_bus'

type ClientMeta = {
  channels: Set<number>
  userId: number | null
}

const port = Number(env.get('WS_PORT') || 3334)
const wss = new WebSocketServer({ port })

console.log(`[WS Server] WebSocket server started on port ${port}`)

const clients = new Map<WebSocket, ClientMeta>()

function safeJsonParse(message: string) {
  try {
    return JSON.parse(message)
  } catch {
    return null
  }
}

wss.on('connection', (ws) => {
  console.log(`[WS Server] New client connected, total clients: ${clients.size + 1}`)
  const meta: ClientMeta = { channels: new Set(), userId: null }
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
    if (type === 'setUserId' && typeof data.userId === 'number') {
      meta.userId = data.userId
      console.log(`[WS] User ${data.userId} connected`)
      return
    }
  })

  ws.on('close', () => {
    console.log(`[WS Server] Client disconnected, remaining clients: ${clients.size - 1}`)
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

realtimeBus.on('channel:refresh', (payload) => {
  const userId = (payload as { userId?: number }).userId
  console.log(`[WS] channel:refresh event received for userId: ${userId}, total clients: ${clients.size}`)

  // Log all connected users
  const connectedUsers: number[] = []
  clients.forEach((meta) => {
    if (meta.userId !== null) {
      connectedUsers.push(meta.userId)
    }
  })
  console.log(`[WS] Connected users: [${connectedUsers.join(', ')}]`)

  // Broadcast to all connected clients - simpler and more reliable
  // Each client will check if they need to refresh
  let sentCount = 0
  clients.forEach((_meta, ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'channel:refresh', data: payload }))
      sentCount++
    }
  })
  console.log(`[WS] Sent channel:refresh to ${sentCount} client(s)`)
})

export { wss }

