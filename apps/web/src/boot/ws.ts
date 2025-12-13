import { boot } from 'quasar/wrappers'
import { useMessageStore } from 'src/stores/message-store'
import { useTypingStore } from 'src/stores/typing-store'
import { useChannelStore } from 'src/stores/channel-store'
import { api } from 'boot/axios'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3334'

export default boot(() => {
  const messages = useMessageStore()
  const typing = useTypingStore()
  const channels = useChannelStore()

  let ws: WebSocket | null = null

  function connect() {
    console.log('[WS] Attempting to connect to:', WS_URL)
    ws = new WebSocket(WS_URL)

    ws.onopen = async () => {
      console.log('[WS] WebSocket connected successfully!')
      // Send userId to server for user-specific broadcasts
      try {
        const response = await api.get('/api/auth/me')
        const userId = response.data.user?.id
        if (userId && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'setUserId', userId: Number(userId) }))
          console.log('[WS] Sent userId to server:', userId)
        } else {
          console.warn('[WS] Could not send userId - userId:', userId, 'ws readyState:', ws?.readyState)
        }
      } catch (err) {
        console.error('[WS] Failed to send userId to WebSocket', err)
      }

      const activeId = channels.activeChannelId
      if (activeId) subscribe(activeId)
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string)
        const { type, data } = payload
        console.log('[WS] Received message:', type, data)
        
        if (type === 'message:new' && data?.message) {
          const m = data.message
          messages.appendFromRealtime(m.channelId, m)
        }
        if (type === 'typing' && data) {
          typing.upsert(data.channelId, {
            userId: String(data.userId),
            nickName: data.nickName,
          })
        }
        if (type === 'channel:refresh') {
          console.log('[WS] Channel refresh received, fetching channels...', data)
          // Refresh channel list when notified (always refresh, even if data is empty)
          channels.fetchChannels().then(() => {
            console.log('[WS] Channels refreshed successfully')
          }).catch((err) => {
            console.error('[WS] Failed to refresh channels:', err)
          })
        }
      } catch (err) {
        console.error('[WS] Message parse error', err)
      }
    }

    ws.onclose = (event) => {
      console.log('[WS] WebSocket closed:', event.code, event.reason)
      setTimeout(connect, 2000)
    }
    ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error)
      ws?.close()
    }
  }

  function subscribe(channelId: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'subscribe', channelId: Number(channelId) }))
  }

  connect()

  // react to active channel changes
  channels.$subscribe((_mutation, state) => {
    const current = state.activeChannelId
    if (current) {
      subscribe(current)
    }
  })

  return
})

