<template>
    <header class="chat-header">
      <q-toolbar class="row items-center q-gutter-md">  
        <!-- Mobile back to channels -->
        <q-btn v-if="isMobile" flat round size="sm" color="white" icon="arrow_back" class="btn-ghost" @click="goBackToChannels" />
        <!--ChannelName + počet členov + status -->
        <q-toolbar-title class="col">
          <div style="font-size:18px; font-weight:600; color:#8b93f9; line-height:1.1">
            {{ active.channelName }}
          </div>
          <div style="font-size:14px; color:#9ca3af; margin-top:2px; ">
            {{ active.memberIds?.length || 0 }} members • {{ active.isPrivate ? 'Private' : 'Public' }}
          </div>
        </q-toolbar-title>
        
        <!-- Action Buttons -->
        <div class="header-right">
          <!-- Accept / Decline -->
          <template v-if="active.isInvited && !isMobile">
            <q-btn
              flat
              dense
              color="green"
              size="sm"
              class="btn-ghost accept-btn"
              @click="acceptInvitation"
            >
              <span class="btn-text">Accept</span>
            </q-btn>
            <q-btn
              flat
              dense
              color="red"
              size="sm"
              class="btn-ghost decline-btn"
              @click="declineInvitation"
            >
              <span class="btn-text">Decline</span>
            </q-btn>
          </template>
          <!-- leave button -->
          <template v-else-if="!isMobile">
            <q-btn
              flat
              dense
              color="red"
              size="sm"
              class="btn-ghost leave-group-btn"
              @click="leaveGroup"
              :disable="!active || active.id === '_fallback'"
            >
              <span class="btn-text">{{ isOwner ? 'Cancel Group' : 'Leave Group' }}</span>
            </q-btn>
          </template>
          <!-- Mobile open members (positioned on far right) -->
          <!-- <q-btn v-if="isMobile" flat round size="sm" color="white" icon="info" class="btn-ghost mobile-info-btn" @click="openMembers" /> -->
        </div>
      </q-toolbar>
    </header>
  </template>
  
  <script setup lang="ts">
  import { computed, watchEffect, inject, ref, onMounted, type Ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useChannelStore, type Channel } from 'src/stores/channel-store' 
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  
  const channels = useChannelStore()
  const route = useRoute()
  const router = useRouter()
  const $q = useQuasar()
  //Injektovaná (poskytovaná parentom) reaktívna hodnota Ref<boolean> - či sme na mobile alebo nie
  const isMobile = inject<Ref<boolean>>('isMobile')
  //injektovaná callback funkcia, ktorá prepína layout panel (napr. 'left' vs 'chat')
  const setActivePanel = inject<((p: 'left'|'chat') => void)>('setActivePanel')
  
  // Current user ID
  const currentUserId = ref<string | null>(null)
  
  // Load current user on mount
  onMounted(async () => {
    try {
      const response = await api.get('/api/auth/me')
      currentUserId.value = String(response.data.user.id)
    } catch (error) {
      console.error('Failed to load current user:', error)
    }
  })

  //Na mobile vráti dozadu do ľavého panelu (zoznam kanálov)
  function goBackToChannels() {
    if (isMobile?.value && setActivePanel) setActivePanel('left')
  }
  // function openMembers() {
  //   if (isMobile?.value && setActivePanel) setActivePanel('right')
  // }
  
  // Bezpečný fallback, aby template nikdy nedostal null/undefined - keby nie je žiaden kanál k dispozícii
  const FALLBACK: Channel = {
    id: '_fallback',
    channelName: '—',
    isPrivate: false,
    ownerId: '_',
    memberIds: [],
  }
  
  // Udržuj store zosúladený s URL (/app/c/:channelId)
  watchEffect(() => {
    const id = route.params.channelId as string | undefined
    if (id && channels.activeChannelId !== id) {
      channels.openChannel(id)
    }
  })
  
  // Vždy vráť platný Channel (nájdený podľa URL, potom active, potom prvý, inak FALLBACK)
  const active = computed<Channel>(() => {
    const id = route.params.channelId as string | undefined
    if (id) {
      const found = channels.channels.find(c => c.id === id)
      if (found) return found
    }
    return channels.activeChannel ?? channels.channels[0] ?? FALLBACK
  })
  
  // Check if current user is owner of the active channel
  const isOwner = computed(() => {
    if (!currentUserId.value || !active.value) return false
    return active.value.ownerId === currentUserId.value
  })

  const leaveGroup = async () => {
    if (!active.value || active.value.id === '_fallback') return
    try {
      await api.post(`/api/channels/${active.value.id}/leave`)
      await channels.fetchChannels()
      // Ak kanal zmizol zo zoznamu (napr. owner ho zrusil), presmeruj na /app
      const stillThere = channels.channels.find(c => c.id === active.value.id)
      if (!stillThere) {
        await router.push('/app')
      }
      // Rozdielne notifikacie podla role
      if (isOwner.value) {
        $q.notify({ type: 'info', message: 'Group cancelled', position: 'top' })
      } else {
        $q.notify({ type: 'info', message: 'You left the group', position: 'top' })
      }
    } catch (error: unknown) {
      console.error('Leave group failed:', error)
      const err = error as { response?: { data?: { message?: string } } }
      const msg = err.response?.data?.message || 'Failed to leave group'
      $q.notify({ type: 'negative', message: msg, position: 'top' })
    }
  }

  // Akceptuje pozvanku, zavola backend a obnovi zoznam kanalov
  const acceptInvitation = async () => {
    if (!active.value || active.value.id === '_fallback') return
    try {
      await api.post(`/api/channels/${active.value.id}/accept`)
      await channels.fetchChannels()
      $q.notify({ type: 'positive', message: 'Invitation accepted', position: 'top' })
    } catch (error: unknown) {
      console.error('Accept invite failed:', error)
      $q.notify({ type: 'negative', message: 'Failed to accept invitation', position: 'top' })
    }
  }

  // Odmietne pozvanku a ak kanal zmizne zo zoznamu, presmeruje na /app
  const declineInvitation = async () => {
    if (!active.value || active.value.id === '_fallback') return
    const channelId = active.value.id
    try {
      await api.post(`/api/channels/${channelId}/reject`)
      await channels.fetchChannels()
      const stillThere = channels.channels.find(c => c.id === channelId)
      if (!stillThere) {
        await router.push('/app')
      }
      $q.notify({ type: 'info', message: 'Invitation declined', position: 'top' })
    } catch (error: unknown) {
      console.error('Decline invite failed:', error)
      $q.notify({ type: 'negative', message: 'Failed to decline invitation', position: 'top' })
    }
  }
  </script>
  
<style scoped>
.chat-header {
  position: fixed;
  top: 0;
  left: var(--left, 320px); /* Account for left sidebar width */
  right: 0; /* No right sidebar */
  z-index: 3;
  background: rgba(11, 13, 16, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(88, 101, 242, 0.2);
  height: 64px;
  display: flex;
  padding: 0 16px;
  transition: left 0.3s ease;
}

.header-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}

.header-left { min-width: 0; }

.channel-title {
  font-size: 18px;
  font-weight: 600;
  color: #8b93f9;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-ghost { background: rgba(74, 78, 132, 0.25); }

.leave-group-btn, .accept-btn, .decline-btn {
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
}

.leave-group-btn:hover, .decline-btn:hover {
  background: rgba(244, 67, 54, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.2);
}

.accept-btn:hover {
  background: rgba(76, 175, 80, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.leave-group-btn:disabled {
  opacity: 0.5;
  transform: none;
}

.btn-text {
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.leave-group-btn .btn-text, .decline-btn .btn-text {
  color: #f44336;
}

.accept-btn .btn-text {
  color: #4caf50;
}

.leave-group-btn:disabled .btn-text {
  color: #9ca3af;
}

/* Typing indicator */
.typing-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.typing-text {
  font-size: 12px;
  color: #9ca3af;
}

.typing-bubbles {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.typing-bubbles span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #9ca3af;
  opacity: 0.5;
  animation: bubble 1.2s infinite ease-in-out;
}

.typing-bubbles span:nth-child(1) { animation-delay: 0s; }
.typing-bubbles span:nth-child(2) { animation-delay: 0.15s; }
.typing-bubbles span:nth-child(3) { animation-delay: 0.3s; }

@keyframes bubble {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-3px); opacity: 1; }
}

/* Responsive design */

@media (max-width: 768px) {
  .chat-header {
    left: 0; /* Remove left sidebar offset */
    right: 0;
    padding: 0 12px;
  }
  
  .header-right {
    gap: 4px;
  }
  
  .btn-text {
    font-size: 12px;
  }
  
  .leave-group-btn, .accept-btn, .decline-btn {
    padding: 6px 12px;
    min-height: 32px;
  }
  
  .mobile-info-btn {
    margin-left: auto;
    margin-right: 0; /* Remove extra margin to match back arrow spacing */
  }
}

@media (max-width: 480px) {
  .chat-header {
    padding: 0 8px;
  }
  
  .q-toolbar-title {
    font-size: 16px;
  }
  
  .header-right {
    flex-direction: row;
    gap: 4px;
  }
  
  .leave-group-btn, .accept-btn, .decline-btn {
    padding: 4px 8px;
    min-height: 28px;
    font-size: 11px;
  }
  
  .mobile-info-btn {
    margin-left: auto;
    margin-right: 8px;
  }
}
</style>
  