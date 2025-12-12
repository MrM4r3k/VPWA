import { boot } from 'quasar/wrappers'
import { useMessageStore } from 'src/stores/message-store'
import { useTypingStore } from 'src/stores/typing-store'
import { useChannelStore } from 'src/stores/channel-store'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3334'

export default boot(() => {
  const messages = useMessageStore()
  const typing = useTypingStore()
  const channels = useChannelStore()

  let ws: WebSocket | null = null

  function connect() {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      const activeId = channels.activeChannelId
      if (activeId) subscribe(activeId)
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string)
        const { type, data } = payload
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
      } catch (err) {
        console.error('WS message parse error', err)
      }
    }

    ws.onclose = () => {
      setTimeout(connect, 2000)
    }
    ws.onerror = () => {
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

