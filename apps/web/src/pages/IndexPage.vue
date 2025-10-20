<template>
  <q-page class="chat-shell" style="background: #0f111a;">
    <div class="grid" :style="{ '--left': leftWidth }">
      <!-- LEFT: Sidebar -->
      <aside class="col-left">
        <SideBar />
      </aside>

      <!-- CENTER: Chat -->
      <main class="col-center">
        <div class="center-inner">
          <!-- Sticky header len v strede -->
          <div class="center-header">
            <ChatHeader />
          </div>

          <!-- Scrollovateľná časť so správami -->
          <q-scroll-area class="center-messages fit" style="margin-top: 80px;">
            <div v-for="n in 50" :key="n">Drawer {{ n }} / 50</div>
            <!-- TODO: MessageList sem -->
          </q-scroll-area>

          <!-- Sticky composer len v strede -->
          <div class="center-composer">
            <MessageComposer />
          </div>
        </div>
      </main>
      
      <!-- <aside class="col-right">
        <ChannelMembers />
      </aside> -->
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideBar from 'src/components/SideBar.vue'
import ChatHeader from 'src/components/ChatHeader.vue'
import MessageComposer from 'src/components/MessageComposer.vue'
import { useChannelStore } from 'src/stores/chat-store'
//import ChannelMembers from 'src/components/ChannelMembers.vue'

const route = useRoute()
const ch = useChannelStore()

// pri vstupe aj pri zmene URL nastav aktívny kanál
const activateFromRoute = () => {
  const id = route.params.channelId as string | undefined
  if (id) ch.openChannel(id)
}
onMounted(activateFromRoute)
watch(() => route.params.channelId, activateFromRoute)

// šírka ľavého stĺpca (prípadne napoj na store pre mini stav)
const leftWidth = '320px'
</script>

<style scoped>
.chat-shell {
  height: 100vh;
  overflow: hidden;
}

/* 2-stĺpcový grid: ľavý | stred */
.grid {
  height: 100%;
  display: grid;
  overflow: hidden;
  grid-template-columns: var(--left, 320px) 1fr;
}

/* stred – vlastný “mini layout” */
.col-center { min-width: 0; }
.center-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* Sticky len v strede (posúva sa spolu s obsahom) */
.center-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #1a1d2e;           
  border-bottom: 1px solid #374151;
}
.center-messages {
  flex: 1;
  min-height: 0;                   /* dôležité pre q-scroll-area */
}
.center-composer {
  position: sticky;
  bottom: 0;
  z-index: 3;

}
/* responzívne */
@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .col-left { display: none; }
}
</style>
