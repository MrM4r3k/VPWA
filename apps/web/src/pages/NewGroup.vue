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
              nie
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

  const store = useChannelStore();
  const tab = ref<'search' | 'create'>('search')
  const search = ref('');
  const router = useRouter();

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return store.channels
    return store.channels.filter(c =>
      c.channelName.toLowerCase().includes(q)
    )
  })

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
  