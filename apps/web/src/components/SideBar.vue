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
          <!--Vytvorenie novej skupiny-->
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
          <!--Notifikácie-->
          <q-btn 
            flat 
            round 
            size="sm" 
            :color="notificationIconColor" 
            :icon="notificationIcon" 
            @click="toggleNotification"
            class="hover-scale"
            style="background: rgba(74, 78, 132, 0.25)"
            :title="notificationTooltip"
          />
          <!--Stav-->
          <q-btn flat round size="sm" :color="statusIconColor" icon="circle" style="background: rgba(74, 78, 132, 0.25)" :title="statusTooltip">
            <q-menu 
            transition-show="rotate" 
            transition-hide="rotate" 
            auto-close 
            style="border-radius: 15px; 
                  border-color: #374151; 
                  border-style: solid; 
                  border-width: 1.5px; 
                  background: #252837">

              <q-list style="min-width: 150px">
                <q-item 
                  clickable 
                  v-close-popup 
                  @click="setStatus('online')" 
                  :class="{ 'status-active': currentStatus === 'online' }"
                  style="border-radius: 8px; color: #ffffff; margin: 4px">
                  <q-item-section avatar>
                    <q-icon name="circle" color="green" size="12px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Online</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item 
                  clickable 
                  v-close-popup 
                  @click="setStatus('DND')" 
                  :class="{ 'status-active': currentStatus === 'DND' }"
                  style="border-radius: 8px; color: #ffffff; margin: 4px">
                  <q-item-section avatar>
                    <q-icon name="circle" color="red" size="12px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Do Not Disturb</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item 
                  clickable 
                  v-close-popup 
                  @click="setStatus('offline')" 
                  :class="{ 'status-active': currentStatus === 'offline' }"
                  style="border-radius: 8px; color: #ffffff; margin: 4px">
                  <q-item-section avatar>
                    <q-icon name="circle" color="grey" size="12px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Offline</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <!--Logout-->
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
            <q-icon name="fiber_manual_record" size="8px" :color="statusIconColor" />
            <span>{{ statusText }}</span>
          </div>
        </div>

        <!-- Channels List -->
        <div class="channel-list">
          <div
            v-for="(c, index) in filtered"
            :key="`channel-${c.id}-${index}`"
            @click="open(c.id)"
            :class="['channel-item', store.activeChannelId === c.id ? 'channel-item--active' : '', c.isInvited ? 'channel-invited' : '']"
          >
          <!-- Private / Public groups-->
            <div class="channel-icon">
              <q-icon :name="c.isPrivate ? 'lock' : 'tag'" size="16px" />
            </div>
            <div class="channel-name">{{ c.channelName }}</div>
            <!--Invite-->
            <div v-if="c.isInvited" class="invitation-badge">
              Invitation
            </div>
            <!--Neprečítané správy-->
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
  import { computed, ref, inject, type Ref, onMounted, onUnmounted } from 'vue';
  import { useChannelStore } from '../stores/channel-store';
  import { useNotificationStore } from '../stores/notification-store';
  import { useMembersStore } from '../stores/members-store';
  import { useRouter } from 'vue-router';
  import { api } from 'boot/axios';
  import { useQuasar } from 'quasar';
  
  defineOptions({ name: 'SideBar' });
  
  const router = useRouter();
  const store = useChannelStore();
  const notifications = useNotificationStore();
  const membersStore = useMembersStore();
  const $q = useQuasar();
  const search = ref('');
  
  // Notification preference state
  const notificationState = ref(0);
  
  // User status - použiť getter zo store (getters sú reaktívne)
  const currentStatus = computed(() => membersStore.currentUserStatus)

  // Inject mobile and panel controls (must be at top level of setup)
  const isMobile = inject<Ref<boolean>>('isMobile')
  const setActivePanel = inject<((p: 'left'|'chat') => void)>('setActivePanel')
  
  // Notification preference functions
  function toggleNotification() {
    notificationState.value = (notificationState.value + 1) % 3
    // NOVÉ: Uložiť do localStorage
    localStorage.setItem('notificationPreference', String(notificationState.value))
  }
  
  // Computed properties for notification icon and tooltip
  const notificationIcon = computed(() => {
    if (notificationState.value === 0) return 'notifications'
    if (notificationState.value === 1) return 'notifications_active'
    return 'notifications_off'
  })
  
  const notificationIconColor = computed(() => {
    if (notificationState.value === 2) return 'grey'
    return 'white'
  })
  
  const notificationTooltip = computed(() => {
    if (notificationState.value === 0) return 'All notifications'
    if (notificationState.value === 1) return 'Mentions only'
    return 'Notifications muted'
  })
  
  // App Visibility API - track when app is visible/hidden
  function handleVisibilityChange() {
    notifications.setAppVisible(!document.hidden)
  }
  
  onMounted(() => {
    // Načítať preferenciu notifikácií
    const saved = localStorage.getItem('notificationPreference')
    if (saved) {
      notificationState.value = Number(saved)
    }
    
    void notifications.requestPermission()
    notifications.setAppVisible(!document.hidden)
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', () => notifications.setAppVisible(true))
    window.addEventListener('blur', () => notifications.setAppVisible(false))
    
    // Načítať kanály a status
    void store.fetchChannels()
    void loadCurrentUserStatus()
  })
  
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', () => notifications.setAppVisible(true))
    window.removeEventListener('blur', () => notifications.setAppVisible(false))
  })

  //Filtrovanie - pozvánka do kanála je prvá
  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    let channels = store.channels //let vytvára premennú, ktorú je možnosť neskôr zmeniť
    
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
    if (isMobile?.value && setActivePanel) setActivePanel('chat')
  }
  

  async function logout() {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Poslanie requestu na server s tokenom v hlavičke
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Vymazanie tokenu z localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth.loggedIn');
      void router.push('/login');
    }
  }

  function newGroup(){
    void router.push('/newGroup');
  }

  // Status functions - AKTUALIZOVANÉ
  async function setStatus(status: 'online' | 'DND' | 'offline') {
    try {
      await api.put('/api/users/me/status', { status })
      
      // Aktualizovať v store pomocou action
      membersStore.updateCurrentUserStatus(status)
      
      $q.notify({
        type: 'positive',
        message: `Status changed to ${status}`,
        position: 'top',
        timeout: 2000
      })
    } catch (error) {
      console.error('Failed to update status', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to update status',
        position: 'top'
      })
    }
  }
  
  // Computed properties for status icon and color
  const statusIconColor = computed(() => {
    const status = currentStatus.value
    if (status === 'online') return 'green'
    if (status === 'DND') return 'red'
    return 'grey'
  })
  
  const statusText = computed(() => {
    const status = currentStatus.value
    if (status === 'online') return 'Online'
    if (status === 'DND') return 'Do Not Disturb'
    return 'Offline'
  })
  
  const statusTooltip = computed(() => {
    return `Status: ${currentStatus.value}`
  })
  
  // Load current user status on mount - AKTUALIZOVANÉ
  async function loadCurrentUserStatus() {
    try {
      const response = await api.get('/api/auth/me')
      const userId = String(response.data.user.id)
      
      // Nastaviť currentUserId v store
      membersStore.setCurrentUserId(userId)
      
      // Uložiť do localStorage pre iné komponenty
      localStorage.setItem('currentUserId', userId)
      
      // Načítať všetkých používateľov
      await membersStore.fetchAll()
      
      // Inicializovať lastKnownStatus pri prvom načítaní
      const currentUser = membersStore.getById(userId)
      if (currentUser?.status) {
        localStorage.setItem('lastKnownStatus', currentUser.status)
      }
    } catch (error) {
      console.error('Failed to load user status', error)
    }
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
@media (max-width: 768px) {
  .sidebar { width: 100vw; }
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
  .channel-invited {
    background: rgba(88, 101, 242, 0.15) !important;
    border-left: 3px solid rgba(88, 101, 242, 0.8);
    font-weight: 600;
  }
  
  /* Status menu active item */
  .status-active {
    background: rgba(88, 101, 242, 0.2) !important;
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
  </style>
