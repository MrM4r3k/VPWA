<template>
  <aside class="members">
    <!-- HEADER -->
    <div class="members__header">
      <q-btn v-if="isMobile" flat round size="sm" color="white" icon="arrow_back" class="btn-ghost header-back" @click="backToChat" />
      <div class="members__title-wrapper">
        <div class="members__title">Members</div>
        <span v-if="isMobile" class="member-count">{{ channels.activeMembers.length }}</span>
      </div>
    </div>

    <!-- MEMBERS -->
    <q-scroll-area class="members__scroll">
      <div class="members__list">
        <div
          v-for="(m, idx) in channels.activeMembers"
          :key="m.id"
          class="member-item"
        >
          <div class="member-avatar">
            <div class="avatar-initials">
              {{ m.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() }}
            </div>
            <div :class="['status-indicator', `status-${m.status}`]"></div>
          </div>
          <div class="member-info">
            <div class="member-name">{{ m.nickName }}</div>
            <div class="member-fullname">{{ m.name }}<span v-if="idx === 0" class="admin-suffix"> - admin</span></div>
          </div>
        </div>
      </div>
    </q-scroll-area>

    <!-- Mobile footer actions -->
    <div v-if="isMobile" class="members__footer">
      <div class="footer-actions" v-if="channels.activeChannel?.isInvited">
        <q-btn flat dense color="green" class="btn-ghost accept-btn" @click="acceptInvitation"><span class="btn-text">Accept</span></q-btn>
        <q-btn flat dense color="red" class="btn-ghost decline-btn" @click="declineInvitation"><span class="btn-text">Decline</span></q-btn>
      </div>
      <div class="footer-actions" v-else>
        <q-btn flat dense color="red" class="btn-ghost leave-group-btn" :disable="!channels.activeChannel || channels.activeChannel.id === '_fallback'" @click="leaveGroup"><span class="btn-text">Leave Group</span></q-btn>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useChannelStore } from '../stores/channel-store'
import { inject, type Ref } from 'vue'
const channels = useChannelStore()
const isMobile = inject<Ref<boolean>>('isMobile')
const setActivePanel = inject<((p: 'left'|'chat'|'right') => void)>('setActivePanel')

function backToChat() {
  if (isMobile?.value && setActivePanel) setActivePanel('chat')
}

function leaveGroup() {}
function acceptInvitation() {}
function declineInvitation() {}
</script>

<style scoped>
.members {
  width: 280px;
  border-left: 1px solid rgba(88, 101, 242, 0.2);
  background: rgba(11, 13, 16, 0.95);
  backdrop-filter: blur(8px);
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}
@media (max-width: 768px) {
  .members { width: 100vw; }
}

.members__header {
  padding: 12px 12px 12px 20px;
  border-bottom: 1px solid rgba(88, 101, 242, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.members__title-wrapper {
  display: flex;
  align-items: center;
  flex-grow: 1;
  justify-content: center;
}

.members__title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 8px;
}

.member-count {
  font-size: 12px;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.header-back {
  margin-right: auto;
}

.members__scroll { flex: 1; min-height: 0; padding-bottom: 64px; }
.members__list { padding: 8px 12px; }

/* Mobile footer */
.members__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(11, 13, 16, 0.95);
  border-top: 1px solid rgba(88, 101, 242, 0.2);
  padding: 10px 12px;
  display: flex;
  justify-content: center;
  z-index: 1002;
}
.footer-actions { display: flex; gap: 8px; }

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
}
.member-item:hover { background: rgba(255, 255, 255, 0.08); }

.member-avatar { position: relative; flex-shrink: 0; }
.avatar-initials {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #8b93f9, #5865f2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
}
.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(24, 26, 31, 0.9);
}
.status-online { background: #22c55e; }
.status-offline { background: #6b7280; }
.status-DND { background: #ef4444; }

.member-info { flex: 1; min-width: 0; }
.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.admin-suffix {
  font-size: 12px;
  color: #9ca3af;
}
.member-fullname {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Custom scrollbar */
.members__scroll :deep(.q-scrollarea__container) { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.3) transparent; }
.members__scroll :deep(.q-scrollarea__container)::-webkit-scrollbar { width: 6px; }
.members__scroll :deep(.q-scrollarea__container)::-webkit-scrollbar-track { background: transparent; }
.members__scroll :deep(.q-scrollarea__container)::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 3px; }
.members__scroll :deep(.q-scrollarea__container)::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }

/* hidden behavior is controlled by parent via .mobile-hidden */
/* layout fixes for header buttons */
.header-back { margin-right: 8px; }
/* avoid weird wide button background */
.members__header :deep(.q-btn) { background: transparent; }
</style>
