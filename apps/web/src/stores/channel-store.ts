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
    ] as Channel[],
    activeChannelId: null as string | null,
  }),
  getters: {
    activeChannel(state): Channel | null {
      return state.channels.find(c => c.id === state.activeChannelId) ?? null
    },
    activeMembers(): Member[] {
      const ms = useMembersStore()
      const ids = this.activeChannel?.memberIds ?? []
      return ms.getMany(ids)
    },
  },
  actions: {
    openChannel(id: string) { this.activeChannelId = id },
  },
})
