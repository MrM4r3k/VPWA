import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'
import { useMessageStore, type Message } from 'src/stores/message-store'
import { useTypingStore } from 'src/stores/typing-store'
import { useChannelStore } from 'src/stores/channel-store'
import { useNotificationStore } from 'src/stores/notification-store'
import { useMembersStore } from 'src/stores/members-store'
import { useWebSocketStore } from 'src/stores/websocket-store'
import { useDraftStore } from 'src/stores/draft-store'
import { api } from 'boot/axios'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3334'

export default boot(() => {
  const messages = useMessageStore()
  const typing = useTypingStore()
  const channels = useChannelStore()
  const notifications = useNotificationStore()
  const membersStore = useMembersStore()
  const wsStore = useWebSocketStore()
  const drafts = useDraftStore()

  let ws: WebSocket | null = null

  // Queue pre offline správy
  const offlineMessageQueue: Message[] = []

  // Helper funkcia pre kontrolu, či zobraziť notifikáciu
  function shouldShowNotification(message: Message, currentUserId: string | null): boolean {
    // Načítať preferenciu
    const pref = Number(localStorage.getItem('notificationPreference') || '0')

    // 0 = všetko, 1 = iba mentions, 2 = muted
    if (pref === 2) return false // Muted

    // NOVÉ: Skontrolovať status používateľa
    if (currentUserId) {
      const currentUser = membersStore.getById(currentUserId)
      // DND a offline blokujú notifikácie (ale NIE správy!)
      if (currentUser?.status === 'DND') return false
      if (currentUser?.status === 'offline') return false
    }

    if (pref === 1) {
      // Iba mentions - skontrolovať či je message.mentionUserId === currentUserId
      if (!currentUserId || !message.mentionUserId) return false
      return String(message.mentionUserId) === currentUserId
    }

    return true // Všetko
  }

  function connect() {
    console.log('[WS] Attempting to connect to:', WS_URL)
    wsStore.setConnecting(true)
    ws = new WebSocket(WS_URL)

    ws.onopen = async () => {
      console.log('[WS] WebSocket connected successfully!')
      wsStore.setConnected(true)
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

            // Skontrolovať status používateľa
            const currentUser = membersStore.getById(currentUserId)

            // OPRAVENÉ: Ak je offline, ulož do queue ALE správu NEPRIDÁVAJ do store teraz
            if (currentUser?.status === 'offline') {
              offlineMessageQueue.push(m)
              console.log('[WS] User is offline, message queued')
              return // Správa sa NEPRIDÁ do store, čaká v queue
            }

            // OPRAVENÉ: Správa sa VŽDY pridá do store (aj pri DND!)
            messages.appendFromRealtime(m.channelId, m)

            // Don't notify if message is from current user
            if (m.author?.id && String(m.author.id) === currentUserId) {
              console.log('[WS] Skipping notification - message is from current user')
              return
            }

            // Notifikácia iba ak app nie je visible ALEBO ak nie je otvorený kanál správy
            const isAppHidden = document.hidden || document.visibilityState === 'hidden'
            const activeChannelId = channels.activeChannelId
            const messageChannelId = String(m.channelId)
            const isActiveChannel = activeChannelId === messageChannelId

            // Skontrolovať, či kanál má pending invitation
            const messageChannel = channels.channels.find(c => c.id === messageChannelId)
            const hasPendingInvitation = messageChannel?.isInvited === true

            // Zobraziť notifikáciu iba ak: app nie je visible ALEBO kanál správy nie je aktívny
            const shouldNotifyByVisibility = isAppHidden || !isActiveChannel

            // Skontrolovať preferenciu notifikácií (všetko/iba mentions/muted)
            // DÔLEŽITÉ: shouldShowNotification už kontroluje DND status!
            const shouldNotifyByPreference = shouldShowNotification(m, currentUserId)

            console.log('[WS] Notification check:', {
              documentHidden: document.hidden,
              visibilityState: document.visibilityState,
              isAppHidden,
              messageChannelId,
              activeChannelId,
              isActiveChannel,
              hasPendingInvitation,
              shouldNotifyByVisibility,
              shouldNotifyByPreference,
              userStatus: currentUser?.status,
              mentionUserId: m.mentionUserId,
              currentUserId: currentUserId,
              preference: Number(localStorage.getItem('notificationPreference') || '0')
            })

            // Nezobraziť notifikáciu ak má kanál pending invitation
            if (hasPendingInvitation) {
              console.log('[WS] ⏭️ Skipping notification - channel has pending invitation')
              return
            }

            if (shouldNotifyByVisibility && shouldNotifyByPreference) {
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
              console.log('[WS] ⏭️ Skipping notification - conditions not met')
            }
          })()
        }
        if (type === 'typing' && data) {
          typing.upsert(String((data as { channelId: number | string }).channelId), {
            userId: String((data as { userId: number | string }).userId),
            nickName: String((data as { nickName?: string }).nickName ?? 'unknown'),
          })
        }

        if (type === 'draft:update' && data) {
          const channelId = String((data as { channelId: number | string }).channelId)
          const userId = String((data as { userId: number | string }).userId)
          const nickName = String((data as { nickName?: string }).nickName ?? 'unknown')
          const text = String((data as { text?: string }).text ?? '')

          drafts.upsert({ channelId, userId, nickName, text })

          // draft update implies "typing" activity
          typing.upsert(channelId, { userId, nickName })
        }

        if (type === 'channel:refresh') {
          console.log('[WS] Channel refresh received, fetching channels...', data)
          // Refresh channel list when notified (always refresh, even if data is empty)
          const currentChannelId = channels.activeChannelId
          channels.fetchChannels().then(() => {
            console.log('[WS] Channels refreshed successfully')

            // If we were on a channel that no longer exists, redirect to welcome page
            if (currentChannelId) {
              const stillExists = channels.channels.find(c => c.id === currentChannelId)
              if (!stillExists) {
                console.log('[WS] Current channel no longer exists, redirecting to /app')
                window.location.href = '/app'
              }
            }
          }).catch((err) => {
            console.error('[WS] Failed to refresh channels:', err)
          })
        }

        if (type === 'user:status:changed' && data) {
          const { userId, status } = data as { userId: number; status: 'online' | 'DND' | 'offline' }
          console.log('[WS] User status changed:', { userId, status })

          // Aktualizovať status v members store - použiť upsert pre reaktivitu
          const member = membersStore.getById(String(userId))
          if (member) {
            // Vytvoriť nový objekt namiesto priamej zmeny vlastnosti
            membersStore.upsert({
              ...member,
              status: status
            })
            console.log('[WS] Updated member status in store:', { userId, status })
          } else {
            // Ak member nie je v store, načítaj všetkých používateľov
            void membersStore.fetchAll()
          }
        }
      } catch (err) {
        console.error('[WS] Message parse error', err)
      }
    }

    ws.onclose = (event) => {
      console.log('[WS] WebSocket closed:', event.code, event.reason)
      wsStore.setConnected(false)
      setTimeout(connect, 2000)
    }
    ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error)
      wsStore.setConnected(false)
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

  // Watch pre zmeny statusu používateľa cez membersStore
  membersStore.$subscribe((_mutation, state) => {
    const currentUserId = localStorage.getItem('currentUserId')
    if (!currentUserId) return

    const user = state.byId[currentUserId]
    if (!user) return

    // Sledovať zmeny statusu
    const lastStatus = localStorage.getItem('lastKnownStatus')
    const currentStatus = user.status

    // OPRAVENÉ: Spracovať queue pri každom prechode z offline na čokoľvek iné
    // offline -> online ALEBO offline -> DND
    if (lastStatus === 'offline' && currentStatus !== 'offline') {
      // Spracovať queue
      console.log('[WS] User is no longer offline, processing queued messages:', offlineMessageQueue.length)
      offlineMessageQueue.forEach((m) => {
        messages.appendFromRealtime(m.channelId, m)
      })
      offlineMessageQueue.length = 0

      // Aktualizovať kanály
      void channels.fetchChannels()
    }

    // Uložiť aktuálny status
    localStorage.setItem('lastKnownStatus', currentStatus)
  })

  return
})