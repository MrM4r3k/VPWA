import { boot } from 'quasar/wrappers'
import { useMessageStore } from 'src/stores/message-store'
import { useTypingStore } from 'src/stores/typing-store'
import { useChannelStore } from 'src/stores/channel-store'
import { useNotificationStore } from 'src/stores/notification-store'
import { api } from 'boot/axios'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3334'

export default boot(() => {
  const messages = useMessageStore()
  const typing = useTypingStore()
  const channels = useChannelStore()
  const notifications = useNotificationStore()

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

      // Subscribe to ALL channels where user is a member, not just active one
      await channels.fetchChannels()
      console.log('[WS] Subscribing to all channels:', channels.channels.length)
      channels.channels.forEach((channel) => {
        subscribe(channel.id)
      })
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string)
        const { type, data } = payload
        console.log('[WS] Received message:', type, data)

        if (type === 'message:new' && data?.message) {
          const m = data.message

          console.log('[WS] Processing new message:', {
            channelId: m.channelId,
            authorId: m.author?.id,
            mentionUserId: m.mentionUserId,
            text: m.text
          })

          // Check if this is a mention for current user and set isMentionForMe
          void (async () => {
            // Load current user ID first
            const currentUserId = await notifications.loadCurrentUserId()
            console.log('[WS] Current user ID:', currentUserId)

            if (!currentUserId) {
              // Still append message even if we can't check mentions
              messages.appendFromRealtime(m.channelId, m)
              return
            }

            // Set isMentionForMe property
            if (m.mentionUserId && String(m.mentionUserId) === currentUserId) {
              m.isMentionForMe = true
              console.log('[WS] This is a mention for current user!')
            }

            // Append message to store
            messages.appendFromRealtime(m.channelId, m)

            // Don't notify if message is from current user
            if (m.author?.id && String(m.author.id) === currentUserId) {
              console.log('[WS] Skipping notification - message is from current user')
              return
            }

            // Check if this is a mention for current user
            const isMention = m.isMentionForMe === true

            const authorName = m.author?.nickName || m.author?.name || 'Someone'
            const channelName = channels.channels.find(c => c.id === String(m.channelId))?.channelName || 'Channel'

            console.log('[WS] Calling showNotification:', {
              authorName,
              channelName,
              channelId: String(m.channelId),
              isMention
            })

            // Show notification if needed
            await notifications.showNotification(
              isMention ? `@${authorName} in ${channelName}` : `${authorName} in ${channelName}`,
              m.text || '',
              String(m.channelId),
              isMention
            )
          })()
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

  // Subscribe to new channels when channel list is updated
  channels.$subscribe((_mutation, state) => {
    // When channels are fetched/updated, subscribe to all of them
    if (state.channels.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
      console.log('[WS] Channels updated, subscribing to all:', state.channels.length)
      state.channels.forEach((channel) => {
        subscribe(channel.id)
      })
    }
  })

  return
})

