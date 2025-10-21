// stores/channel-store.ts
import { defineStore } from 'pinia'

export type UserStatus = 'online' | 'offline' | 'DND'

export interface Member {
  id: string
  name: string      // celé meno
  nickName: string  // unikátne, používa sa v príkazoch /invite @nickName
  email?: string
  status: UserStatus
}

export interface Channel {
  id: string
  channelName: string     // unikátne meno kanála
  isPrivate: boolean      // private/public
  lastMessage?: string
  lastTimeAgo?: string
  unread?: number
  members: Member[]       // ← zoznam členov patrí kanálu
  ownerId: string         // zakladateľ/administrátor
  lastActivityAt?: string // na zánik po 30 dňoch
}

export const useChannelStore = defineStore('channels', {
  state: () => ({
    channels: [
      {
        id: 't1',
        channelName: 'Team Alpha',
        isPrivate: false,
        lastMessage: 'Meeting moved to 3PM',
        unread: 3,
        ownerId: 'u1',
        members: [
          { id: 'u1', name: 'Sarah Johnson', nickName: 'sarah', status: 'online' },
          { id: 'u2', name: 'Mike Chen', nickName: 'mike', status: 'offline' },
          { id: 'u3', name: 'Emma Wilson', nickName: 'emma', status: 'DND' },
          { id: 'u6', name: 'Mike Johnson', nickName: 'mike123', status: 'online' },
          { id: 'u7', name: 'Sarah Chen', nickName: 'sarah6', status: 'offline' },
          { id: 'u8', name: 'Emma Chen', nickName: 'emma', status: 'DND' },
        ],
      },
      {
        id: 't2',
        channelName: 'Backend Crew',
        isPrivate: true,
        lastMessage: 'API keys rotated',
        unread: 0,
        ownerId: 'u2',
        members: [
          { id: 'u2', name: 'Mike Chen', nickName: 'mike', status: 'offline' },
          { id: 'u4', name: 'David Park', nickName: 'david', status: 'offline' },
        ],
      },
      {
        id: 't3',
        channelName: 'Team Beta',
        isPrivate: false,
        lastMessage: 'Hello',
        unread: 5,
        ownerId: 'u3',
        members: [
          { id: 'u1', name: 'Sarah Johnson', nickName: 'sarah', status: 'online' },
          { id: 'u3', name: 'Emma Wilson', nickName: 'emma', status: 'DND' },
          { id: 'u2', name: 'Mike Chen', nickName: 'mike', status: 'offline' },
          { id: 'u4', name: 'David Park', nickName: 'david', status: 'offline' },
        ],
      },
      {
        id: 't4',
        channelName: 'Team X',
        isPrivate: false,
        lastMessage: 'Hello',
        ownerId: 'u3',
        members: [
          { id: 'u1', name: 'Sarah Johnson', nickName: 'sarah', status: 'online' },
          { id: 'u3', name: 'Emma Wilson', nickName: 'emma', status: 'DND' },
          { id: 'u2', name: 'Mike Chen', nickName: 'mike', status: 'offline' },
          { id: 'u4', name: 'David Park', nickName: 'david', status: 'offline' },
        ],
      },
      {
        id: 't5',
        channelName: 'Team Y',
        isPrivate: false,
        lastMessage: 'Hello',
        ownerId: 'u3',
        members: [
          { id: 'u1', name: 'Sarah Johnson', nickName: 'sarah', status: 'online' },
          { id: 'u3', name: 'Emma Wilson', nickName: 'emma', status: 'DND' },
          { id: 'u2', name: 'Mike Chen', nickName: 'mike', status: 'offline' },
          { id: 'u4', name: 'David Park', nickName: 'david', status: 'offline' },
        ],
      },
    ] as Channel[],
    activeChannelId: null as string | null,
  }),
  getters: {
    activeChannel(state): Channel | null {
      return state.channels.find(c => c.id === state.activeChannelId) ?? null
    },
    activeMembers(): Member[] {
      return this.activeChannel?.members ?? []
    },
  },
  actions: {
    openChannel(id: string) {
      this.activeChannelId = id
    },
  },
})
