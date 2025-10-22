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
            <MessageList />
          </q-scroll-area>

          <!-- Typing Indicator (design only) -->
          <div class="typing-indicator">
            <div class="typing-indicator__container">
              <div class="typing-indicator__inner">
                <div class="typing-bubbles" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="typing-text"><strong>Alex</strong> is typing…</span>
              </div>
            </div>
          </div>

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
import MessageList from 'src/components/MessageList.vue'
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
  padding: 20px 0;
  padding-top: 80px;   /* 64px header + spacing */
  padding-bottom: 112px; /* 64-80px composer + spacing */
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(88, 101, 242, 0.18), transparent),
    radial-gradient(1000px 500px at 110% 110%, rgba(32, 34, 37, 0.55), transparent),
    #0b0d10;
}
/* Typing indicator positioning */
.typing-indicator {
  position: fixed;
  left: var(--left, 320px);
  right: var(--right, 280px);
  bottom: 112px; /* align above footer height */
  z-index: 3;
  display: block;
  pointer-events: none;
}
.typing-indicator__container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-left: 20px; /* align with message content */
}
.typing-indicator__inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(24, 26, 31, 0.9);
  border: 1px solid rgba(88, 101, 242, 0.15);
  border-radius: 12px;
  padding: 6px 10px;
  pointer-events: auto;
}
.typing-text {
  font-size: 12px;
  color: #c9cdd4;
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
/* scroll area inner padding */
:deep(.q-scrollarea__content) {
  padding-left: 20px;
  padding-right: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
/* custom scrollbar */
:deep(.q-scrollarea__thumb) {
  background: rgba(88, 101, 242, 0.5);
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
