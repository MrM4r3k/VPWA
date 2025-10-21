<template>
    <div class="page">
      <q-card dark bordered style="height: 500px; width: 400px; border-radius: 20px; background: #8b92f936;">
        
        <!-- HEAD -->
        <q-card-section class="row items-center justify-center">
          <q-tabs v-model="tab" class="text-white">
            <q-tab name="search" label="Search group" />
            <q-tab name="create" label="Create new group" />
          </q-tabs>
        </q-card-section>
  
        <q-separator dark inset />

        <q-card-section class="q-pa-sm">
          <q-tab-panels v-model="tab" class="bg-transparent text-white">
            <!-- SEARCH -->
            <q-tab-panel name="search" >
              <q-input
                v-model="search"
                rounded
                outlined
                dense
                label="Search groups..."
                bg-color="grey-9"
                standout="bg-grey-9 text-white"
                input-class="text-white"
                style="margin-bottom: 20px;"
              >
                <template #prepend>
                  <q-icon name="search" color="grey-5" />
                </template>
              </q-input>
              
              <q-separator dark inset />
              <!-- CHANNELS -->
              <q-scroll-area style="height: 300px; max-width: 350px; padding: 20px;">
                <q-list padding separator>
                    <q-item
                    v-for="c in filtered"
                    :key="c.id"
                    clickable 
                    v-ripple
                    @click="open(c.id)"
                    :class="['conv-item', store.activeChannelId === c.id ? 'conv-item--active' : '']"
                        
                    >
                      <q-item-section style="padding: 15px;">
                        <q-item-label class="text-weight-medium ellipsis"  :style="{ color: '#8b93f9' }">
                                {{ c.channelName }}
                        </q-item-label>
                      </q-item-section>
        
                    </q-item>  
                </q-list>
              </q-scroll-area>

            </q-tab-panel>
            <!-- CREATE -->
            <q-tab-panel name="create">
                <q-input
                v-model="search"
                rounded
                outlined
                dense
                label="Search contacts..."
                bg-color="grey-9"
                standout="bg-grey-9 text-white"
                input-class="text-white"
                style="margin-bottom: 20px;"
              >
                <template #prepend>
                  <q-icon name="search" color="grey-5" />
                </template>
              </q-input>


              <q-input
                v-model="text"
                rounded
                outlined
                dense
                label="Group name..."
                bg-color="grey-9"
                standout="bg-grey-9 text-white"
                input-class="text-white"
                style="margin-bottom: 20px;"
              >
              </q-input>

              <q-separator dark inset></q-separator>

              <q-scroll-area style="height: 230px; max-width: 350px; padding: 12px;">
                <q-list class="bg-transparent">
                    <q-item
                        v-for="m in filteredMembers"
                        :key="m.id"
                        clickable 
                        v-ripple
                        
                    >
                        <q-item-section avatar>
                            <q-avatar size="40px" color="primary" text-color="white">
                                {{ initials(m.name) }}
                            </q-avatar>
                        </q-item-section>

                        <q-item-section>
                            <q-item-label class="text-white">
                                {{ m.name }}
                            </q-item-label>
                            <q-item-label caption class="text-grey-5">
                                @{{ m.nickName }}
                            </q-item-label>
                        </q-item-section>
                            
                        <q-item-section >

                        </q-item-section>

                    </q-item>
                </q-list>
              </q-scroll-area>

            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </div>
  </template>
  
  <script setup lang="ts">
    import { computed } from 'vue';
  import { ref } from 'vue'
  import { useChannelStore } from '../stores/channel-store'
  import { useRouter } from 'vue-router';
  import { useMembersStore, type Member } from 'src/stores/members-store';

  const store = useChannelStore();
  const ms = useMembersStore()

  const tab = ref<'search' | 'create'>('search')
  const search = ref('');
  const router = useRouter();
  const text = ref('')

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return store.channels
    return store.channels.filter(c =>
      c.channelName.toLowerCase().includes(q)
    )
  })

  const allMembers = computed<Member[]>(() => Object.values(ms.byId))
  
  const filteredMembers = computed<Member[]>(() => {                        
  const q = search.value.trim().toLowerCase()
  if (!q) return allMembers.value
  return allMembers.value.filter(m =>
    m.name.toLowerCase().includes(q) || m.nickName.toLowerCase().includes(q)
  )
  })

  function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()
  }
  function open(id: string) {
    // prejdi na chat route: /app/c/:channelId
    void router.push({ name: 'chat', params: { channelId: id } });
  }
  
  </script>
  
  <style scoped>
  .page{
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #1a1d2e;
  }
  
  </style>
  