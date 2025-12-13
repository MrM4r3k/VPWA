import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'
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

            // NOVÉ: Notifikácia iba ak app nie je visible ALEBO ak nie je otvorený kanál správy
            const isAppHidden = document.hidden || document.visibilityState === 'hidden'
            const activeChannelId = channels.activeChannelId
            const messageChannelId = String(m.channelId)
            const isActiveChannel = activeChannelId === messageChannelId

            // Zobraziť notifikáciu iba ak: app nie je visible ALEBO kanál správy nie je aktívny
            const shouldNotify = isAppHidden || !isActiveChannel

            console.log('[WS] Notification check:', {
              documentHidden: document.hidden,
              visibilityState: document.visibilityState,
              isAppHidden,
              messageChannelId,
              activeChannelId,
              isActiveChannel,
              shouldNotify
            })

            if (shouldNotify) {
              const authorName = m.author?.nickName || m.author?.name || 'Unknown'
              const messageText = m.text || ''
              const truncatedText = messageText.length > 50
                ? messageText.substring(0, 50) + '...'
                : messageText

              console.log('[WS] ✅ Showing notification:', { authorName, truncatedText })

              // Zobraziť Quasar notifikáciu (v aplikácii)
              try {
                const notification = Notify.create({
                  message: authorName,
                  caption: truncatedText,
                  color: 'primary',
                  position: 'bottom-left',
                  timeout: 5000,
                  classes: 'custom-notification'
                })
                console.log('[WS] ✅ Quasar notification created successfully', notification)
              } catch (error) {
                console.error('[WS] ❌ Error creating Quasar notification:', error)
              }

              // Zobraziť systémovú notifikáciu (aj keď je okno minimalizované)
              if (isAppHidden && 'Notification' in window) {
                void (async () => {
                  try {
                    // Požiadať o povolenie, ak ešte nie je udelené
                    if (Notification.permission === 'default') {
                      const permission = await Notification.requestPermission()
                      console.log('[WS] Notification permission:', permission)
                    }

                    // Zobraziť systémovú notifikáciu iba ak máme povolenie
                    if (Notification.permission === 'granted') {
                      const channelName = channels.channels.find(c => c.id === messageChannelId)?.channelName || 'Channel'
                      const systemNotification = new Notification(`${authorName} in ${channelName}`, {
                        body: truncatedText,
                        icon: '/favicon.ico',
                        badge: '/favicon.ico',
                        tag: `channel-${messageChannelId}`, // Rovnaké tagy sa nahradia
                        requireInteraction: false,
                        silent: false
                      })
                      console.log('[WS] ✅ System notification created successfully', systemNotification)

                      // Automaticky zatvoriť po 5 sekundách
                      setTimeout(() => {
                        systemNotification.close()
                      }, 5000)
                    } else {
                      console.log('[WS] ⚠️ Notification permission not granted:', Notification.permission)
                    }
                  } catch (error) {
                    console.error('[WS] ❌ Error creating system notification:', error)
                  }
                })()
              }
            } else {
              console.log('[WS] ⏭️ Skipping notification - app is visible and user is on active channel')
            }
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

