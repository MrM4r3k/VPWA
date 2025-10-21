<template>
  <aside class="members">
    <!-- HEADER -->
    <div class="members__header">
      <div class="members__title">Members</div>
      <div class="header-actions">
        <!-- ak bude treba tak odkomentovat, 3 bodky na mangovanie ludi v skupine -->
        <!-- <q-btn flat round size="sm" icon="more_vert" color="white" class="btn-ghost" /> -->
        <div class="members__count">{{ channels.activeMembers.length }}</div>
      </div>
    </div>

    <!-- MEMBERS -->
    <q-scroll-area class="members__scroll">
      <div class="members__list">
        <div
          v-for="m in channels.activeMembers"
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
            <div class="member-fullname">{{ m.name }}</div>
          </div>
        </div>
      </div>
    </q-scroll-area>
  </aside>
</template>

<script setup lang="ts">
import { useChannelStore } from '../stores/channel-store'
const channels = useChannelStore()
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

.members__header {
  padding: 12px 12px 12px 20px;
  border-bottom: 1px solid rgba(88, 101, 242, 0.2);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  flex-shrink: 0;
}

.members__title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-actions { display: flex; align-items: center; gap: 6px; }
.btn-ghost { background: rgba(74, 78, 132, 0.25); }

.members__count {
  font-size: 12px;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.members__scroll { flex: 1; min-height: 0; }
.members__list { padding: 8px 12px; }

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

@media (max-width: 900px) {
  .members { transform: translateX(100%); transition: transform 0.3s ease; }
}
</style>
