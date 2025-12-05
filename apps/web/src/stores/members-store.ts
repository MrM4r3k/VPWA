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
        } as Record<string, Member>
    }),
    getters: {//Čítanie dát
        getById: (state) => (id: string) => state.byId[id], //Vracia používateľa podľa ID - ak nie je -> undefined

        //Najprv získa celý state, potom vráti funkciu, ktorá prejde každé ID z poľa, z objektu state.byId
        //zoberie príslušného člena, odstráni všetky neexistujúce (undefined) hodnoty pomocou .filter(Boolean)
        // a vráti výsledok ako pole objektov typu Member[].
        getMany: (state) => (ids: string[]) =>
            ids.map(id => state.byId[id]).filter(Boolean) as Member[],
    },
    actions: {//Menia dáta
        upsert(member: Member) { //Pridať nového člena alebo aktualizovať existujúceho podľa id
            this.byId[member.id] = member
        },
        upsertMany(members: Member[]) { //Naraz pridať viac členov
            members.forEach(m => this.upsert(m))
        },
        remove(id: string) { //Odstrániť člena podľa jeho id
            delete this.byId[id]
        },
        // Nacita realnych userov z backendu a ulozi ich do byId
        async fetchAll() {
            const response = await api.get('/api/users')
            const users = response.data.users as { id: number; name: string; nickName: string; email?: string }[]

            const next: Record<string, Member> = {}
            users.forEach((u) => {
                const member: Member = {
                    id: String(u.id),
                    name: u.name,
                    nickName: u.nickName,
                    status: 'online',
                }

                if (u.email) {
                    member.email = u.email
                }
                next[member.id] = member
            })

            // Nahradime povodne mocky realnymi usermi
            this.byId = next
        },
    }
})
