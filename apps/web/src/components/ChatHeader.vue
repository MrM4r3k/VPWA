<template>
    <header class="chat-header">
      <q-toolbar class="row items-center q-gutter-md">  
        <q-toolbar-title class="col">
          <div style="font-size:18px; font-weight:600; color:#8b93f9; line-height:1.1">
            {{ active.channelName }}
          </div>
          <div style="font-size:14px; color:#9ca3af; margin-top:2px; ">
            {{ active.members.length }} members • {{ active.isPrivate ? 'Private' : 'Public' }}
          </div>
        </q-toolbar-title>  
      </q-toolbar>
    </header>
  </template>
  
  <script setup lang="ts">
  import { computed, watchEffect } from 'vue'
  import { useRoute } from 'vue-router'
  import { useChannelStore, type Channel } from 'src/stores/chat-store' // správna cesta!
  
  const channels = useChannelStore()
  const route = useRoute()
  
  // Bezpečný fallback, aby template nikdy nedostal null/undefined
  const FALLBACK: Channel = {
    id: '_fallback',
    channelName: '—',
    isPrivate: false,
    members: [],
    ownerId: '_',
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
  </script>
  
<style scoped>
.chat-header {
  /* prebíjame globálne .q-header { position: fixed } */
  position: fixed;
  top: 0;
  left: auto !important;
  right: auto !important;
  width: 100%;
  z-index: 3;

  background: #1a1d2e;
  border-bottom: 1px solid #374151;
  height: 80px;
  display: flex;
  padding: 0 16px;
}
</style>
  