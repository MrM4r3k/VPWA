import { defineStore } from 'pinia'
import type { Member } from './members-store'
import { useMembersStore } from './members-store'

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
    channels: [
      {
        id: 't1',
        channelName: 'Team Alpha',
        isPrivate: false,
        unread: 3,
        ownerId: 'u1',
        memberIds: ['u1', 'u2', 'u3', 'u6', 'u7', 'u8'],
      },
      {
        id: 't2',
        channelName: 'Backend Crew',
        isPrivate: true,
        unread: 0,
        ownerId: 'u2',
        memberIds: ['u2', 'u4'],
      },
      {
        id: 't3',
        channelName: 'Team Beta',
        isPrivate: false,
        unread: 5,
        ownerId: 'u3',
        memberIds: ['u1', 'u3', 'u2', 'u4'],
      },
      {
        id: 't4',
        channelName: 'Team X',
        isPrivate: false,
        ownerId: 'u3',
        memberIds: ['u1', 'u3', 'u2', 'u4'],
      },
      {
        id: 't5',
        channelName: 'Team Y',
        isPrivate: false,
        ownerId: 'u3',
        memberIds: ['u1', 'u3', 'u2', 'u4'],
      },
      {
        id: 'invite1',
        channelName: 'Design Team',
        isPrivate: true,
        ownerId: 'u2',
        memberIds: ['u2', 'u4'],
        isInvited: true,
      },
    ] as Channel[],
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
  },
})
