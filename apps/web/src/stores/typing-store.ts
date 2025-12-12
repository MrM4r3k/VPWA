import { defineStore } from 'pinia'

type TypingUser = {
  userId: string
  nickName: string
  lastSeen: number
}

export const useTypingStore = defineStore('typing', {
  state: () => ({
    byChannel: {} as Record<string, TypingUser[]>,
  }),
  getters: {
    listByChannel: (state) => (channelId: string | null | undefined) => {
      if (!channelId) return []
      return state.byChannel[channelId] ?? []
    },
  },
  actions: {
    upsert(channelId: string, user: { userId: string; nickName: string }) {
      const now = Date.now()
      const list = this.byChannel[channelId] ?? []
      const existing = list.find((u) => u.userId === user.userId)
      if (existing) {
        existing.lastSeen = now
        existing.nickName = user.nickName
      } else {
        list.push({ ...user, lastSeen: now })
      }
      this.byChannel[channelId] = list
      this.prune(channelId)
    },
    prune(channelId: string) {
      const list = this.byChannel[channelId]
      if (!list) return
      const now = Date.now()
      this.byChannel[channelId] = list.filter((u) => now - u.lastSeen < 6000)
    },
    pruneAll() {
      Object.keys(this.byChannel).forEach((cid) => this.prune(cid))
    },
  },
})

