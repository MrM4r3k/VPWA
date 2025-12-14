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
          <q-scroll-area
            ref="sa"
            class="center-messages fit"
            :class="{ 'center-messages--typing': hasTypingActivity }"
          >
            <MessageList ref="messageListRef" :scroll-target="saContainer" />
          </q-scroll-area>

          <!-- Typing Indicator (design only) -->
          <div v-if="hasTypingActivity" class="typing-indicator">
            <div class="typing-indicator__container">
              <div
                class="typing-indicator__inner"
                role="button"
                tabindex="0"
                @click="handleTypingPreviewClick"
                @keydown.enter.prevent="handleTypingPreviewClick"
                @keydown.space.prevent="handleTypingPreviewClick"
              >
                <div class="typing-bubbles" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="typing-text">
                  <div class="typing-text__header">
                    <strong>{{ typingIndicatorHeadline }}</strong>
                    <span class="typing-text__suffix">{{ typingIndicatorSuffix }}</span>
                  </div>
                  <span class="typing-text__meta">Click to see more</span>
                </div>
                <q-icon name="chevron_right" size="18px" class="typing-indicator__icon" />
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
    <TypingPreviewPopup
      v-model:visible="showTypingPreview"
      :people="typingPreview"
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
import TypingPreviewPopup from 'src/components/TypingPreviewPopup.vue'
import { useDraftStore, type DraftEntry } from 'src/stores/draft-store'
import { useTypingStore } from 'src/stores/typing-store'
import { useMembersStore } from 'src/stores/members-store'

const route = useRoute()
const ch = useChannelStore()
const draftsStore = useDraftStore()
const typingStore = useTypingStore()
const membersStore = useMembersStore()

// Panel visibility (desktop/tablet)
const sidebarVisible = ref(true)

type TypingDraft = {
  id: string
  name: string
  nick: string
  text: string
}

// Popup states
const showMembersPopup = ref(false)
const showTypingPreview = ref(false)

const typingPreview = computed<TypingDraft[]>(() => {
  const channelId = ch.activeChannelId
  if (!channelId) return []

  // Prefer real draft texts; fall back to "typing" users with empty text
  const drafts = draftsStore.listByChannel(channelId)

  const fromDrafts = drafts
    .filter((d) => d.text.trim().length > 0)
    .map((d: DraftEntry) => {
      const member = membersStore.getById(String(d.userId))
      return {
        id: String(d.userId),
        name: member?.name ?? d.nickName,
        nick: d.nickName,
        text: d.text,
      }
    })

  if (fromDrafts.length > 0) return fromDrafts

  const typingUsers = typingStore.listByChannel(channelId)
  return typingUsers.map((u) => {
    const member = membersStore.getById(String(u.userId))
    return {
      id: String(u.userId),
      name: member?.name ?? u.nickName,
      nick: u.nickName,
      text: '',
    }
  })
})

const hasTypingActivity = computed(() => {
  // show indicator if there is at least one draft OR at least one typing user
  const channelId = ch.activeChannelId
  if (!channelId) return false
  return draftsStore.listByChannel(channelId).length > 0 || typingStore.listByChannel(channelId).length > 0
})

const firstName = (name: string) => {
  const part = name.trim().split(' ')[0]
  return part || name
}

const typingIndicatorHeadline = computed(() => {
  const list = typingPreview.value
  const first = list[0]
  const second = list[1]
  if (!first) return ''
  if (!second) return firstName(first.name)
  if (list.length === 2) {
    return `${firstName(first.name)}, ${firstName(second.name)}`
  }
  return 'More users'
})

const typingIndicatorSuffix = computed(() => {
  const count = typingPreview.value.length
  if (!count) return ''
  if (count === 1) return 'is typing…'
  return 'are typing…'
})

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
onMounted(activateFromRoute) //životný cyklus
watch(() => route.params.channelId, activateFromRoute) //Sleduje, či sa zmení parameter v URL


// Expose q-scroll-area container element for QInfiniteScroll target
const sa = ref<QScrollArea | null>(null)
const saContainer = ref<Element | undefined>(undefined)
const attachScrollTarget = () => {
  // q-scroll-area exposes getScrollTarget() on the component proxy
  const el = sa.value?.getScrollTarget?.()
  saContainer.value = el
}
onMounted(() => {
  checkScreenSize() //Kontroluje, či je používateľ na mobile
  attachScrollTarget() //Vyhľadá vnútorný element scrollovacej oblasti
  // also re-attach on possible layout changes
  window.addEventListener('resize', () => { //Pri každom zmene veľkosti okna sa:
    checkScreenSize() //skontroluje veľkosť obrazovky
    attachScrollTarget() //aktualizuje scroll target
  })
})

onBeforeUnmount(() => { //Predtým, než komponent zmizne
  window.removeEventListener('resize', () => { //Vyčistenie
    checkScreenSize()
    attachScrollTarget()
  })
})

// Handle show members popup
function handleShowMembers() {
  showMembersPopup.value = true
}

function handleTypingPreviewClick() {
  if (!typingPreview.value.length) return
  showTypingPreview.value = true
}

let pruneInterval: number | null = null
onMounted(() => {
  // Periodically prune stale typing/drafts so UI disappears after inactivity
  pruneInterval = window.setInterval(() => {
    draftsStore.pruneAll(30000)
    typingStore.pruneAll()
  }, 1500)
})

onBeforeUnmount(() => {
  if (pruneInterval !== null) {
    window.clearInterval(pruneInterval)
  }
})

</script>

<style scoped>
.chat-shell {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

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
.center-messages--typing {
  padding-bottom: 180px;
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
  padding: 10px 14px;
  pointer-events: auto;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.typing-indicator__inner:hover {
  border-color: rgba(139, 147, 249, 0.5);
  transform: translateY(-1px);
}
.typing-indicator__inner--disabled {
  opacity: 0.6;
  cursor: default;
  pointer-events: none;
}
.typing-text {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #c9cdd4;
}
.typing-text__header {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.typing-text__suffix {
  font-weight: 400;
}
.typing-text__meta {
  font-size: 11px;
  color: #9fa4c7;
  margin-top: 2px;
}
.typing-indicator__icon {
  color: #9fa4c7;
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
    padding-bottom: 120px; /* Increased from 100px for more clearance */
  }
  .center-messages--typing {
    padding-bottom: 180px;
  }
}

@media (max-width: 480px) {
  .center-messages {
    padding-left: 12px;
    padding-right: 12px;
  }
  .center-messages--typing {
    padding-bottom: 170px;
  }
  .typing-indicator__container {
    padding-left: 12px;
  }
}
</style>
