import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export type MessageAuthor = {
  id: string
  name: string
  surname?: string
  nickName: string
}

export type Message = {
  id: string
  channelId: string
  text: string
  createdAt?: string
  author: MessageAuthor | null
  mentionUserId: string | null
  isMentionForMe?: boolean
}

type ChannelMessages = {
  items: Message[]
  nextCursor: string | null
  loading: boolean
  fullyLoaded: boolean
}

export const useMessageStore = defineStore('messages', {
  state: () => ({
    byChannel: {} as Record<string, ChannelMessages>,
  }),
  getters: {
    listByChannel: (state) => (channelId: string | null | undefined): Message[] => {
      if (!channelId) return []
      return state.byChannel[channelId]?.items ?? []
    },
  },
  actions: {
    reset(channelId: string) {
      this.byChannel[channelId] = {
        items: [],
        nextCursor: null,
        loading: false,
        fullyLoaded: false,
      }
    },

    ensure(channelId: string) {
      if (!this.byChannel[channelId]) {
        this.reset(channelId)
      }
    },

    async fetchInitial(channelId: string) {
      this.ensure(channelId)
      const entry = this.byChannel[channelId]!
      if (entry.loading) return
      entry.loading = true
      try {
        const res = await api.get(`/api/channels/${channelId}/messages`)
        const messages = (res.data.messages ?? []) as Message[]
        // API returns newest first; reverse to chronological asc for UI
        entry.items = [...messages].reverse()
        entry.nextCursor = res.data.nextCursor ?? null
        entry.fullyLoaded = !entry.nextCursor
      } finally {
        entry.loading = false
      }
    },

    async fetchOlder(channelId: string) {
      this.ensure(channelId)
      const entry = this.byChannel[channelId]!
      if (entry.loading || entry.fullyLoaded) return
      if (!entry.nextCursor) {
        entry.fullyLoaded = true
        return
      }
      entry.loading = true
      try {
        const res = await api.get(`/api/channels/${channelId}/messages`, {
          params: { cursor: entry.nextCursor },
        })
        const messages = (res.data.messages ?? []) as Message[]
        const older = [...messages].reverse() // chronological asc
        entry.items = [...older, ...entry.items]
        entry.nextCursor = res.data.nextCursor ?? null
        entry.fullyLoaded = !entry.nextCursor
      } finally {
        entry.loading = false
      }
    },

    async send(channelId: string, text: string): Promise<Message> {
      this.ensure(channelId)
      const entry = this.byChannel[channelId]!
      const res = await api.post(`/api/channels/${channelId}/messages`, { text })
      const message = res.data.message as Message
      // Check if message already exists (from WebSocket) before adding
      const exists = entry.items.some(m => m.id === message.id)
      if (!exists) {
        entry.items = [...entry.items, message]
      }
      return message
    },

    appendFromRealtime(channelId: string, message: Message) {
      this.ensure(channelId)
      const entry = this.byChannel[channelId]!
      // Check if message already exists (avoid duplicates from send + WebSocket)
      const exists = entry.items.some(m => m.id === message.id)
      if (!exists) {
        entry.items = [...entry.items, message]
      }
    },
  },
})

