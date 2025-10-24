<template>
  <q-page class="chat-shell">

    <div class="grid" :style="{ '--left': leftWidth }">
      <!-- LEFT: Sidebar -->
      <aside class="col-left" :class="{ 'col-left--hidden': !sidebarVisible, 'mobile-hidden': isMobile && activePanel!=='left' }">
        <SideBar />
      </aside>

      <!-- CENTER: Chat -->
      <main class="col-center" :class="{ 'mobile-hidden': isMobile && activePanel!=='chat' }">
        <div class="center-inner">
          <!-- Chat Header -->
          <ChatHeader />

          <!-- Messages Area -->
          <q-scroll-area ref="sa" class="center-messages fit">
            <MessageList :scroll-target="saContainer" />
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
          <MessageComposer @show-members="handleShowMembers" />
        </div>
      </main>
    </div>

    <!-- Members List Popup -->
    <ChannelMembers
      v-model:visible="showMembersPopup" 
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, onBeforeUnmount, computed, provide } from 'vue'
import { QScrollArea } from 'quasar'
import { useRoute } from 'vue-router'
import SideBar from 'src/components/SideBar.vue'
import ChatHeader from 'src/components/ChatHeader.vue'
import MessageList from 'src/components/MessageList.vue'
import MessageComposer from 'src/components/MessageComposer.vue'
import { useChannelStore } from 'src/stores/channel-store'
import ChannelMembers from 'src/components/ChannelMembers.vue'

const route = useRoute()
const ch = useChannelStore()

// Panel visibility (desktop/tablet)
const sidebarVisible = ref(true)

// Members popup state
const showMembersPopup = ref(false)

// Mobile single active panel: 'left' | 'chat'
const activePanel = ref<'left' | 'chat'>('chat')

// Screen size detection
const isMobile = ref(false)
const isTablet = ref(false)

const checkScreenSize = () => {
  const width = window.innerWidth
  isMobile.value = width <= 768
  isTablet.value = width > 768 && width <= 1200
  
  // Auto-hide panels on smaller screens
  if (isMobile.value) {
    sidebarVisible.value = true
    activePanel.value = 'chat'
  }
}

// desktop toggles removed; panels remain controlled by layout and mobile activePanel

// Dynamic column widths based on panel visibility
const leftWidth = computed(() => sidebarVisible.value ? '320px' : '0px')

// Provide mobile panel controls to children
provide('isMobile', isMobile)
provide('activePanel', activePanel)
provide('setActivePanel', (panel: 'left' | 'chat') => { activePanel.value = panel })

// pri vstupe aj pri zmene URL nastav aktívny kanál
const activateFromRoute = () => {
  const id = route.params.channelId as string | undefined
  if (id) ch.openChannel(id)
  if (isMobile.value) activePanel.value = 'chat'
}
onMounted(activateFromRoute)
watch(() => route.params.channelId, activateFromRoute)


// Expose q-scroll-area container element for QInfiniteScroll target
const sa = ref<QScrollArea | null>(null)
const saContainer = ref<Element | undefined>(undefined)
const attachScrollTarget = () => {
  // q-scroll-area exposes getScrollTarget() on the component proxy
  const el = sa.value?.getScrollTarget?.()
  saContainer.value = el
}
onMounted(() => {
  checkScreenSize()
  attachScrollTarget()
  // also re-attach on possible layout changes
  window.addEventListener('resize', () => {
    checkScreenSize()
    attachScrollTarget()
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', () => {
    checkScreenSize()
    attachScrollTarget()
  })
})

// Handle show members popup
function handleShowMembers() {
  showMembersPopup.value = true
}

</script>

<style scoped>
.chat-shell {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Removed desktop toggle buttons (were overlaying the logo) */

/* Mobile switcher */
.mobile-switcher {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1002;
  display: flex;
  gap: 4px;
  background: rgba(11, 13, 16, 0.95);
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 20px;
  padding: 4px 6px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.mobile-switcher .q-btn {
  background: rgba(74, 78, 132, 0.2);
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
}

.mobile-switcher .q-btn:hover {
  background: rgba(88, 101, 242, 0.4);
  transform: scale(1.1);
}

.mobile-switcher .q-btn[unelevated] {
  background: rgba(88, 101, 242, 0.8);
  color: white;
  box-shadow: 0 2px 8px rgba(88, 101, 242, 0.4);
}

/* 2-stĺpcový grid: ľavý | stred */
.grid {
  height: 100%;
  display: grid;
  overflow: hidden;
  grid-template-columns: var(--left, 320px) 1fr;
  transition: grid-template-columns 0.3s ease;
}

/* Panel hiding */
.col-left--hidden {
  display: none;
}


/* Mobile single panel mode */
.mobile-hidden {
  display: none !important;
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
  right: 0;
  bottom: 80px; /* Reduced from 100px to move much closer to input */
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
/* Responsive breakpoints */

@media (min-width: 769px) {
  .typing-indicator {
    bottom: 112px; /* Desktop: proper position above input */
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr !important;
  }
  
  .col-left {
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1001;
  }
  
  .col-center {
    width: 100vw !important;
  }
  
  .typing-indicator {
    left: 0;
    right: 0;
  }
  .center-messages {
    padding-top: 60px; /* Reduced padding for mobile */
    padding-bottom: 110px; /* Increased from 100px for more clearance */
  }
}

@media (max-width: 480px) {
  .center-messages {
    padding-left: 12px;
    padding-right: 12px;
  }
  .typing-indicator__container {
    padding-left: 12px;
  }
}
</style>
