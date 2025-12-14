import { defineStore } from 'pinia'

export type DraftEntry = {
  channelId: string
  userId: string
  nickName: string
  text: string
  updatedAt: number
}

export const useDraftStore = defineStore('drafts', {
  state: () => ({
    byChannel: {} as Record<string, Record<string, DraftEntry>>,
  }),
  getters: {
    listByChannel: (state) => (channelId: string | null | undefined): DraftEntry[] => {
      if (!channelId) return []
      const map = state.byChannel[channelId] ?? {}
      return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt)
    },
  },
  actions: {
    upsert(payload: { channelId: string; userId: string; nickName: string; text: string }) {
      const now = Date.now()
      const channel = (this.byChannel[payload.channelId] ??= {})
      const text = payload.text ?? ''

      if (text.length === 0) {
        delete channel[payload.userId]
        return
      }

      channel[payload.userId] = {
        channelId: payload.channelId,
        userId: payload.userId,
        nickName: payload.nickName,
        text,
        updatedAt: now,
      }
    },

    remove(channelId: string, userId: string) {
      const channel = this.byChannel[channelId]
      if (!channel) return
      delete channel[userId]
    },

    prune(channelId: string, maxAgeMs = 12000) {
      const channel = this.byChannel[channelId]
      if (!channel) return
      const now = Date.now()
      Object.keys(channel).forEach((userId) => {
        const entry = channel[userId]
        if (!entry) return
        if (now - entry.updatedAt > maxAgeMs) {
          delete channel[userId]
        }
      })
    },

    pruneAll(maxAgeMs = 12000) {
      Object.keys(this.byChannel).forEach((channelId) => this.prune(channelId, maxAgeMs))
    },
  },
})
