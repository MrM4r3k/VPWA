<template>
  <q-page class="chat-shell">
    <div class="grid" :style="{ '--left': leftWidth, '--right': rightWidth }">
      <!-- LEFT: Sidebar -->
      <aside class="col-left">
        <SideBar />
      </aside>

      <!-- CENTER: Chat -->
      <main class="col-center">
        <div class="center-inner">
          <!-- Chat Header -->
          <ChatHeader />

          <!-- Messages Area -->
          <q-scroll-area class="center-messages fit">
            <div v-for="n in 50" :key="n">Drawer {{ n }} / 50</div>
            <!-- TODO: MessageList sem -->
          </q-scroll-area>

          <!-- Message Composer -->
          <MessageComposer />
        </div>
      </main>

      <!-- RIGHT: Members -->
      <aside class="col-right">
        <ChannelMembers />
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideBar from 'src/components/SideBar.vue'
import ChatHeader from 'src/components/ChatHeader.vue'
import MessageComposer from 'src/components/MessageComposer.vue'
import { useChannelStore } from 'src/stores/channel-store'
import ChannelMembers from 'src/components/ChannelMembers.vue'

const route = useRoute()
const ch = useChannelStore()

// pri vstupe aj pri zmene URL nastav aktívny kanál
const activateFromRoute = () => {
  const id = route.params.channelId as string | undefined
  if (id) ch.openChannel(id)
}
onMounted(activateFromRoute)
watch(() => route.params.channelId, activateFromRoute)

// šírka stĺpcov
const leftWidth = '320px'
const rightWidth = '280px'
</script>

<style scoped>
.chat-shell {
  height: 100vh;
  overflow: hidden;
}

/* 3-stĺpcový grid: ľavý | stred | pravý */
.grid {
  height: 100%;
  display: grid;
  overflow: hidden;
  grid-template-columns: var(--left, 320px) 1fr var(--right, 280px);
}

/* stred – vlastný "mini layout" */
.col-center { 
  min-width: 0; 
  display: flex;
  flex-direction: column;
}
.center-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.center-messages {
  flex: 1;
  min-height: 0;                   /* dôležité pre q-scroll-area */
  padding: 16px;
  padding-top: 88px;   /* 64px header + spacing */
  padding-bottom: 104px; /* 64-80px composer + spacing */
}
/* responzívne */
@media (max-width: 1200px) {
  .grid { grid-template-columns: var(--left, 320px) 1fr; }
  .col-right { display: none; }
}

@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .col-left { display: none; }
  .col-right { display: none; }
}
</style>
