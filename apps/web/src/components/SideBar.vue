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
          <!-- Notification Switch -->
          <q-btn
            flat
            round
            size="sm"
            :color="notificationColor"
            :icon="notificationIcon"
            @click="toggleNotification"
            class="hover-scale"
            :style="notificationStyle"
          >
            <q-tooltip class="bg-grey-8 text-white" :offset="[0, 8]">
              {{ notificationTooltip }}
            </q-tooltip>
          </q-btn>
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
        <!-- Server Info -->
        <div class="server-info">
          <div class="server-name">Loom Chat</div>
          <div class="server-status">
            <q-icon name="fiber_manual_record" size="8px" color="green" />
            <span>Online</span>
          </div>
        </div>

        <!-- Channels List -->
        <div class="channel-list">
          <div
            v-for="c in filtered"
            :key="c.id"
            @click="open(c.id)"
            :class="['channel-item', store.activeChannelId === c.id ? 'channel-item--active' : '']"
          >
            <div class="channel-icon">
              <q-icon :name="c.isPrivate ? 'lock' : 'tag'" size="16px" />
            </div>
            <div class="channel-name">{{ c.channelName }}</div>
            <div v-if="c.isInvited" class="invitation-badge">
              Invitation
            </div>
            <div v-else-if="c.unread && c.unread > 0" class="unread-badge">
              {{ c.unread > 99 ? '99+' : c.unread }}
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!filtered.length" class="empty-state">
          <q-icon name="forum" size="32px" />
          <span>No channels found</span>
        </div>
      </q-scroll-area>
    </nav>
  </aside>
</template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useChannelStore } from '../stores/channel-store';
  import { useRouter } from 'vue-router';
  
  defineOptions({ name: 'SideBar' });
  
  const router = useRouter();
  const store = useChannelStore();
  const search = ref('');
  
  // Notification switch state
  const notificationState = ref(0); // 0: normal, 1: mentions only, 2: muted
  
  const notificationIcon = computed(() => {
    switch (notificationState.value) {
      case 0: return 'notifications'; // Normal notifications
      case 1: return 'notifications_active'; // Mentions only
      case 2: return 'notifications_off'; // Muted
      default: return 'notifications';
    }
  });
  
  const notificationTooltip = computed(() => {
    switch (notificationState.value) {
      case 0: return 'All notifications';
      case 1: return 'Mentions only';
      case 2: return 'Notifications muted';
      default: return 'All notifications';
    }
  });
  
  const notificationColor = computed(() => {
    switch (notificationState.value) {
      case 0: return 'primary'; // Normal notifications - app primary color
      case 1: return 'warning'; // Mentions only - warning accent
      case 2: return 'red'; // Muted - danger
      default: return 'primary';
    }
  });
  
  const notificationStyle = computed(() => {
    return 'background: rgba(74, 78, 132, 0.25)';
  });
  
  function toggleNotification() {
    notificationState.value = (notificationState.value + 1) % 3;
  }

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    let channels = store.channels
    
    // Search filter
    if (q) {
      channels = channels.filter(c =>
        c.channelName.toLowerCase().includes(q)
      )
    }
    
    // Sort channels
    return channels.sort((a, b) => {
      // If one is invited and the other isn't, invited comes first
      if (a.isInvited && !b.isInvited) return -1
      if (!a.isInvited && b.isInvited) return 1
      
      return 0
    })
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
    background: rgba(11, 13, 16, 0.95);
    backdrop-filter: blur(8px);
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    border-right: 1px solid rgba(88, 101, 242, 0.2);
  }
  .sidebar__header {
    border-bottom: 1px solid rgba(88, 101, 242, 0.2);
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

  /* Server Info */
  .server-info {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(88, 101, 242, 0.2);
    margin-bottom: 8px;
  }
  .server-name {
    font-size: 16px;
    font-weight: 600;
    color: #e5e7eb;
    margin-bottom: 4px;
  }
  .server-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #9ca3af;
  }

  /* Channel List */
  .channel-list {
    padding: 8px 8px 0;
  }
  .channel-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    margin: 1px 0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }
  .channel-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .channel-item--active {
    background: rgba(88, 101, 242, 0.15);
    color: #e5e7eb;
  }
  .channel-item--active::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: #8b93f9;
    border-radius: 0 2px 2px 0;
  }
  .channel-icon {
    color: #9ca3af;
    display: flex;
    align-items: center;
  }
  .channel-item--active .channel-icon {
    color: #8b93f9;
  }
  .channel-name {
    flex: 1;
    font-size: 14px;
    color: #cbd5e1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .channel-item--active .channel-name {
    color: #e5e7eb;
  }
  .unread-badge {
    background: #8b93f9;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }
  .invitation-badge {
    background: #4caf50;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    text-align: center;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 20px;
    color: #9ca3af;
    text-align: center;
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