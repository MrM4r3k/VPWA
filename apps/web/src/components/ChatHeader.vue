<template>
    <header class="chat-header">
      <q-toolbar class="row items-center q-gutter-md">  
        <q-toolbar-title class="col">
          <div style="font-size:18px; font-weight:600; color:#8b93f9; line-height:1.1">
            {{ active.channelName }}
          </div>
          <div style="font-size:14px; color:#9ca3af; margin-top:2px; ">
            {{ members.length }} members • {{ active.isPrivate ? 'Private' : 'Public' }}
          </div>
        </q-toolbar-title>
        
        <!-- Leave Group Button -->
        <div class="header-right">
          <q-btn
            flat
            dense
            color="red"
            size="sm"
            class="btn-ghost leave-group-btn"
            @click="leaveGroup"
            :disable="!active || active.id === '_fallback'"
          >
            <span class="btn-text">Leave Group</span>
          </q-btn>
        </div>
      </q-toolbar>
    </header>
  </template>
  
  <script setup lang="ts">
  import { computed, watchEffect } from 'vue'
  import { useRoute } from 'vue-router'
  import { useChannelStore, type Channel } from 'src/stores/channel-store' 
  
  const channels = useChannelStore()
  const members = computed(() => channels.activeMembers)
  const route = useRoute()
  
  // Bezpečný fallback, aby template nikdy nedostal null/undefined
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

  const leaveGroup = () => {
  }
  </script>
  
<style scoped>
.chat-header {
  position: fixed;
  top: 0;
  left: 320px; /* Account for left sidebar width */
  right: 280px; /* Account for right sidebar width */
  z-index: 3;
  background: rgba(11, 13, 16, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(88, 101, 242, 0.2);
  height: 64px;
  display: flex;
  padding: 0 16px;
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

.leave-group-btn {
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
}

.leave-group-btn:hover {
  background: rgba(244, 67, 54, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.2);
}

.leave-group-btn:disabled {
  opacity: 0.5;
  transform: none;
}

.btn-text {
  font-size: 13px;
  font-weight: 600;
  color: #f44336;
  line-height: 1;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.leave-group-btn:disabled .btn-text {
  color: #9ca3af;
}
</style>
  