<template>
  <aside class="sidebar" aria-label="Conversations">
    <!-- HEADER -->
    <header class="sidebar__header">
      <q-toolbar class="bg-transparent no-border q-pa-none justify-between items-center">
        <!-- Logo -->
        <div class="row items-center">
          <q-img
            src="../assets/logo.png"
            alt="Loom"
            fit="contain"
            style="width: 120px; height: 32px"
          />
        </div>

        <!-- Akčné ikony -->
        <div class="row items-center q-gutter-xs">
          <q-btn
            flat
            round
            size="sm"
            color="white"
            icon="add_comment"
            @click="newGroup"
            class="hover-scale"
            style="background: rgba(74, 78, 132, 0.25)"
          />
          <q-btn flat round size="sm" color="white" icon="person" style="background: rgba(74, 78, 132, 0.25)">
            <q-menu 
            transition-show="rotate" 
            transition-hide="rotate" 
            auto-close 
            style="border-radius: 15px; 
                  border-color: #374151; 
                  border-style: solid; 
                  border-width: 1.5px; 
                  background: #252837">

              <q-list style="min-width: 100px">
                <q-item clickable v-ripple v-close-popup style="border-radius: 15px; color: #ffffff; margin: 5px">
                      <q-item clickable v-close-popup @click="() => {}" style="border-radius: 20px;">
                        <q-item-section>
                          <q-item-label>Online</q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item clickable v-close-popup @click="() => {}" style="border-radius: 20px;">
                        <q-item-section>
                          <q-item-label>Offline</q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item clickable v-close-popup @click="() => {}" style="border-radius: 20px;">
                        <q-item-section>
                          <q-item-label>Do not disturb</q-item-label>
                        </q-item-section>
                      </q-item>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn 
            flat 
            round 
            size="sm" 
            color="red" 
            icon="logout" 
            class="hover-scale" 
            clickable v-ripple 
            @click="logout" 
            v-close-popup 
            style="background: rgba(74, 78, 132, 0.25)">
          </q-btn>
        </div>
      </q-toolbar>

      <!-- Search -->
      <q-input
        v-model="search"
        rounded
        outlined
        label="Search conversations..."
        class="q-mt-sm"
        bg-color="grey-9"
        standout="bg-grey-9 text-white"
        input-class="text-white"
      >
        <template #prepend>
          <q-icon name="search" color="grey-5" />
        </template>
      </q-input>
    </header>

    <!-- BODY -->
    <nav class="sidebar__nav" role="navigation">
      <q-scroll-area class="sidebar__scroll">
        <!-- List -->
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
              <q-item-label class="text-weight-medium ellipsis" :style="{ color: '#8b93f9' }">
                {{ c.channelName }}
              </q-item-label>
              
            </q-item-section>
            <q-item-section side v-if="c.unread && c.unread > 0">
              <q-badge :label="c.unread" color="primary"/>
            </q-item-section>
          </q-item>
          <!-- Empty state -->
          <div v-if="!filtered.length" class="q-pa-md row items-center text-grey-5">
            <q-icon name="forum" size="28px" class="q-mr-sm" />
            <span>No conversations found</span>
          </div>
        </q-list>
      </q-scroll-area>
    </nav>
  </aside>
</template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useChannelStore } from '../stores/chat-store';
  import { useRouter } from 'vue-router';
  
  defineOptions({ name: 'SideBar' });
  
  const router = useRouter();
  const store = useChannelStore();
  const search = ref('');

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return store.channels
    return store.channels.filter(c =>
      c.channelName.toLowerCase().includes(q) ||
      (c.lastMessage ?? '').toLowerCase().includes(q)
    )
  })
  
  function open(id: string) {
    // prejdi na chat route: /app/c/:channelId
    void router.push({ name: 'chat', params: { channelId: id } });
  }
  

  function logout() {
    localStorage.removeItem('auth.loggedIn');
    void router.push('/login');
  }

  function newGroup(){
    void router.push('/newGroup');
  }

  </script>
  
  <style scoped>
  /* Layout & container */
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 320px;
    background: #1a1d2e;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    border-right: 1px solid #374151;
  }
  .sidebar__header {
    border-bottom: 1px solid #374151;
    padding: 12px 16px;
  }
  .sidebar__nav {
    flex: 1 1 auto;
    min-height: 0;
  }
  .sidebar__scroll {
    height: 100%;
  }

  /* Hover efekt na ikony */
  .hover-scale {
    transition: transform 0.2s ease;
  }
  .hover-scale:hover {
    transform: scale(1.05);
  }

  /* Zoznam – jemné zvýraznenie */
  .conv-item {
    padding: 12px 14px;
    margin: 6px 8px;
    transition: background 0.15s ease, border-color 0.15s ease;
    border-radius: 20px;
    background: rgba(74, 78, 132, 0.25);
    
  }
  .conv-item:hover {
    background: #8b92f936;
    border-left: 2px solid;
    border-left-color: #8b93f9;
  }
  .conv-item--active {
    background: rgba(88, 101, 242, 0.12);
    border-left-color: #5865f2;
  }
  /* Responsive správanie (mobil – voliteľné) */
  @media (max-width: 500px) {
    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    .sidebar.open {
      transform: translateX(0);
    }
  }
  </style>