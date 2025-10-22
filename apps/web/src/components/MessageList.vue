<template>
  <div class="messages">
    <div
      v-for="msg in visibleMessages"
      :key="msg.id"
      class="message-row"
      :class="{ 'is-mention': isMentionForMe(msg.text) }"
    >
      <div class="avatar">{{ getInitials(msg.author.name) }}</div>
      <div class="bubble">
        <div class="meta">
          <span class="author">{{ msg.author.name }}</span>
          <span class="time">{{ msg.time }}</span>
        </div>
        <div class="text" v-html="renderText(msg.text)"></div>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChannelStore, type Channel } from 'src/stores/channel-store'
import { useMembersStore, type Member } from 'src/stores/members-store'

type Msg = {
  id: string
  channelId: string
  author: Member
  text: string
  time: string
}

const channels = useChannelStore()
const members = useMembersStore()

// GUI-only: pick a fixed current user from the mock data
const CURRENT_USER_ID = 'u1'
const currentUser = computed<Member | null>(() => members.getById(CURRENT_USER_ID) ?? null)

// Mock messages per channel (GUI-only)
const mockMessages = computed<Msg[]>(() => {
  const active: Channel | null = channels.activeChannel
  if (!active) return []

  const m = (id: string) => members.getById(id)
  const safe = (u: Member | undefined) => u ?? { id: 'x', name: 'Unknown', nickName: 'unknown', status: 'offline' }

  // Simple different sets by channelId
  if (active.id === 't1') {
    return [
      { id: 'm1', channelId: 't1', author: safe(m('u2')), text: 'Morning team! Stand-up at 10:00. @sarah can you share the API update?', time: '09:12' },
      { id: 'm2', channelId: 't1', author: safe(m('u1')), text: 'Sure, I will post a summary after the call.', time: '09:15' },
      { id: 'm3', channelId: 't1', author: safe(m('u3')), text: 'Quick note: deployment moved to 14:30. @mike123 please review the checklist.', time: '09:18' },
      { id: 'm4', channelId: 't1', author: safe(m('u6')), text: 'I have added the metrics panel. Feedback welcome.', time: '09:25' },
      { id: 'm5', channelId: 't1', author: safe(m('u7')), text: 'Design draft uploaded. @sarah what do you think?', time: '09:41' },
    ]
  }
  if (active.id === 't2') {
    return [
      { id: 'm6', channelId: 't2', author: safe(m('u2')), text: 'Backend crew sync in 5. @david bring the logs please.', time: '11:00' },
      { id: 'm7', channelId: 't2', author: safe(m('u4')), text: 'On it. Also found a race condition in worker-2.', time: '11:01' },
    ]
  }
  // default set
  return [
    { id: 'm8', channelId: active.id, author: safe(m('u3')), text: 'Welcome to ' + active.channelName + '!', time: '08:00' },
    { id: 'm9', channelId: active.id, author: safe(m('u1')), text: 'Ping @' + (currentUser.value?.nickName ?? 'me') + ' to test mention highlight.', time: '08:05' },
  ]
})

const visibleMessages = computed(() => mockMessages.value)

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

function isMentionForMe(text: string): boolean {
  const me = currentUser.value
  if (!me) return false
  const nick = me.nickName
  if (!nick) return false
  const re = new RegExp(`(^\\s|\\s)@${escapeRegExp(nick)}(?=\\b)`, 'i')
  return re.test(text)
}

function renderText(text: string): string {
  // Highlight all @mentions visually in text
  const mentionRe = /(^|\s)@([a-zA-Z0-9_]+)/g
  return text.replace(mentionRe, (m, p1, p2) => `${p1}<span class="mention">@${p2}</span>`)
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
</style>


