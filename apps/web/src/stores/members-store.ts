import { defineStore } from 'pinia'

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
        } as Record<string, Member>
    }),
    getters: {
        getById: (state) => (id: string) => state.byId[id],
        getMany: (state) => (ids: string[]) =>
            ids.map(id => state.byId[id]).filter(Boolean) as Member[],
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
        }
    }
})
