<template>
    <aside class="members">
      <div class="members__header">Members</div>
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item v-for="m in channels.activeMembers" :key="m.id">
            <q-item-section avatar>
              <q-avatar size="50px" class="avatar-chip text-white">
                {{ m.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium text-white">
                {{ m.nickName }}
              </q-item-label>
              <q-item-label caption class="text-grey-5">
                {{ m.name }} • {{ m.status }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </aside>
</template>

<script setup lang="ts">
import { useChannelStore } from '../stores/chat-store'
const channels = useChannelStore()
</script>

<style scoped>
.members { 
    width: 280px; 
    border-left: 1px solid #374151; 
    background: #1a1d2e; 
    height: 100vh; 
    position: fixed; 
    right: 0; 
    top: 0; }
.members__header { 
    padding: 25px 90px; 
    border-bottom: 1px solid #374151; 
    color: #8b93f9; 
    font-weight: 600;
    height: 80px;
    font-size: 20px;
}
.avatar-chip { 
    background: linear-gradient(to bottom right, #3b82f6, #a855f7);
    font-weight: 700; 
}
@media (max-width: 900px) { 
    .members { 
        transform: translateX(100%);
        transition: transform 0.3s ease; 
    } 
} /* skry na mobiloch */
</style>
