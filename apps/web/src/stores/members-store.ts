import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export type UserStatus = 'online' | 'offline' | 'DND'

export interface Member {
    id: string
    name: string
    nickName: string
    email?: string
    status: UserStatus
}

export const useMembersStore = defineStore('members', {
    state: () => ({
        byId: {
            u1: { id: 'u1', name: 'Sarah Johnson', nickName: 'sarah', status: 'online' },
            u2: { id: 'u2', name: 'Mike Chen', nickName: 'mike', status: 'offline' },
            u3: { id: 'u3', name: 'Emma Wilson', nickName: 'emma', status: 'DND' },
            u4: { id: 'u4', name: 'David Park', nickName: 'david', status: 'offline' },
            u6: { id: 'u6', name: 'Mike Johnson', nickName: 'mike123', status: 'online' },
            u7: { id: 'u7', name: 'Sarah Chen', nickName: 'sarah6', status: 'offline' },
            u8: { id: 'u8', name: 'Emma Chen', nickName: 'emma8', status: 'DND' },
        } as Record<string, Member>,
        currentUserId: null as string | null, // NOVÉ: držať currentUserId v store
    }),
    getters: {
        getById: (state) => (id: string) => state.byId[id],

        getMany: (state) => (ids: string[]) =>
            ids.map(id => state.byId[id]).filter(Boolean) as Member[],

        // NOVÉ: Getter pre aktuálny status
        currentUserStatus(): UserStatus {
            if (!this.currentUserId) return 'online'
            const user = this.byId[this.currentUserId]
            return user?.status || 'online'
        },

        // NOVÉ: Getter pre aktuálneho usera
        currentUser(): Member | null {
            if (!this.currentUserId) return null
            return this.byId[this.currentUserId] || null
        }
    },
    actions: {
        upsert(member: Member) {
            this.byId[member.id] = member
        },

        upsertMany(members: Member[]) {
            members.forEach(m => this.upsert(m))
        },

        remove(id: string) {
            delete this.byId[id]
        },

        // NOVÉ: Nastaviť currentUserId
        setCurrentUserId(userId: string) {
            this.currentUserId = userId
        },

        // NOVÉ: Aktualizovať status aktuálneho usera
        updateCurrentUserStatus(status: UserStatus) {
            if (!this.currentUserId) return
            const user = this.byId[this.currentUserId]
            if (user) {
                this.byId[this.currentUserId] = {
                    ...user,
                    status
                }
            }
        },

        async fetchAll() {
            const response = await api.get('/api/users')
            const users = response.data.users as { id: number; name: string; nickName: string; email?: string; status?: 'online' | 'DND' | 'offline' }[]

            const userIds = new Set<string>()
            users.forEach((u) => {
                const memberId = String(u.id)
                userIds.add(memberId)

                const member: Member = {
                    id: memberId,
                    name: u.name,
                    nickName: u.nickName,
                    status: u.status || 'online',
                }

                if (u.email) {
                    member.email = u.email
                }

                this.byId[memberId] = member
            })

            Object.keys(this.byId).forEach(id => {
                if (!userIds.has(id)) {
                    delete this.byId[id]
                }
            })
        },
    }
})