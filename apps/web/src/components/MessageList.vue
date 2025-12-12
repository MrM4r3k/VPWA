<template>
  <div class="message-list-wrapper" :class="{ 'has-pending-invite': hasPendingInvite }">
    <q-infinite-scroll
      class="messages"
      reverse
      @load="onLoad"
      :scroll-target="scrollTarget"
    >
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner color="primary" name="dots" size="40px" />
        </div>
      </template>

      <div
        v-for="msg in visibleMessages"
        :key="msg.id"
        class="message-row"
        :class="{ 'is-mention': isMentionForMe(msg.text) }"
      >
        <div class="avatar">{{ getInitials(msg.author?.name ?? '?') }}</div>
        <div class="bubble">
          <div class="meta">
            <span class="author">{{ msg.author?.name ?? 'Unknown' }}</span>
            <span class="time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <div class="text" v-html="renderText(msg.text)"></div>
        </div>
      </div>
    </q-infinite-scroll>
    
    <div v-if="hasTyping" class="typing-inline">Someone is typing…</div>
    
    <!-- Blur overlay when invite is pending -->
    <div v-if="hasPendingInvite" class="invite-blur-overlay">
      <div class="invite-blur-message">
        <q-icon name="mail" size="48px" color="primary" />
        <p class="invite-blur-text">You have a pending invitation</p>
        <p class="invite-blur-subtext">Accept or decline the invitation to view messages</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useChannelStore } from 'src/stores/channel-store'
import { useMessageStore, type Message } from 'src/stores/message-store'
import { useTypingStore } from 'src/stores/typing-store'
import { date } from 'quasar'

const channels = useChannelStore()
const messages = useMessageStore()
const typing = useTypingStore()

// scroll target passed from parent (IndexPage -> q-scroll-area)
const { scrollTarget } = defineProps<{ scrollTarget?: string | Element | undefined }>()

// Current authenticated user is loaded elsewhere; we just read member nicknames for display
const hasPendingInvite = computed(() => channels.activeChannel?.isInvited === true)

const activeChannelId = computed(() => channels.activeChannelId)

// load messages when channel changes
watch(activeChannelId, async (id) => {
  if (!id) return
  await messages.fetchInitial(id)
}, { immediate: true })

const visibleMessages = computed(() => messages.listByChannel(activeChannelId.value))

const hasTyping = computed(() => {
  const cid = activeChannelId.value
  if (!cid) return false
  return typing.listByChannel(cid).length > 0
})

async function onLoad(_index: number, done: () => void) {
  const activeId = activeChannelId.value
  if (!activeId) {
    done()
    return
  }
  await messages.fetchOlder(activeId)
  done()
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

function isMentionForMe(msg: string | Message): boolean {
  if (typeof msg === 'string') return false
  return msg.isMentionForMe === true
}

function renderText(text: string): string {
  // Highlight all @mentions visually in text
  const mentionRe = /(^|\s)@([a-zA-Z0-9_]+)/g
  return text.replace(mentionRe, (m, p1, p2) => `${p1}<span class="mention">@${p2}</span>`)
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  return date.formatDate(iso, 'HH:mm')
}
</script>

<style scoped>
.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-row {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: start;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.message-row:hover {
  background: rgba(88, 101, 242, 0.06);
}

.message-row.is-mention {
  background: rgba(88, 101, 242, 0.12);
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(88,101,242,0.35), rgba(32,34,37,0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.bubble { /* Discord-like: no box bubble, just text block */
  padding-top: 2px;
}

.meta {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.author {
  color: #8b93f9;
  font-weight: 600;
}

.time {
  color: #9ca3af;
  font-size: 12px;
}

.text {
  color: #cbd5e1;
  line-height: 1.5;
  margin-top: 2px;
}

.text .mention {
  color: #c7d2fe;
  background: rgba(88, 101, 242, 0.22);
  padding: 0 4px;
  border-radius: 4px;
}

/* Blur effect for pending invites */
.message-list-wrapper {
  position: relative;
}

.message-list-wrapper.has-pending-invite .messages {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
  opacity: 0.3;
}

.invite-blur-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: none;
}

.invite-blur-message {
  text-align: center;
  padding: 32px;
  background: rgba(11, 13, 16, 0.95);
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 400px;
}

.invite-blur-text {
  color: #8b93f9;
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 8px 0;
}

.invite-blur-subtext {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .invite-blur-message {
    padding: 24px;
    max-width: 90%;
    margin: 0 16px;
  }

  .invite-blur-text {
    font-size: 16px;
  }

  .invite-blur-subtext {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .invite-blur-message {
    padding: 20px;
    max-width: 85%;
  }

  .invite-blur-text {
    font-size: 15px;
    margin: 12px 0 6px 0;
  }

  .invite-blur-subtext {
    font-size: 12px;
  }
}
</style>


