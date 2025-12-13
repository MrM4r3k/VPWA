import { defineStore } from 'pinia'
import type { Member } from './members-store'
import { useMembersStore } from './members-store'
import { api } from 'boot/axios'

export interface Channel {
  id: string
  channelName: string
  isPrivate: boolean
  lastTimeAgo?: string
  unread?: number
  ownerId: string
  lastActivityAt?: string
  memberIds: string[]
  isInvited?: boolean
}

export const useChannelStore = defineStore('channels', {
  state: () => ({
    channels: [] as Channel[],
    activeChannelId: null as string | null,
  }),
  getters: { //Čítanie dát
    activeChannel(state): Channel | null {
      return state.channels.find(c => c.id === state.activeChannelId) ?? null //Prehľadá zoznam kanálov a vráti ten, ktorého id sa zhoduje s aktívnym.
    },
    activeMembers(): Member[] {
      const ms = useMembersStore() //Inštancia members-store
      const ids = this.activeChannel?.memberIds ?? [] //Ak je aktívny kanál, vytiahne z neho pole memberIds
      return ms.getMany(ids) //Vráti celé pole členov aktuálneho kanála
    },
  },
  actions: {//Menia dáta
    openChannel(id: string) { this.activeChannelId = id }, //Zmena aktívneho kanála

    async fetchChannels() {
      try {
        console.log('[ChannelStore] Fetching channels...')
        const response = await api.get('/api/channels')
        // API returns { channels: [...] }
        const channels = response.data.channels as Channel[]
        
        // NOVÉ: Zoradiť - najprv pozvané kanály
        this.channels = channels.sort((a, b) => {
          if (a.isInvited && !b.isInvited) return -1
          if (!a.isInvited && b.isInvited) return 1
          return 0
        })
        
        console.log(`[ChannelStore] Loaded ${this.channels.length} channels`)
      } catch (err) {
        console.error('[ChannelStore] Failed to fetch channels:', err)
      }
    },

    setChannels(channels: Channel[]) {
      this.channels = channels
    },
  },
})
