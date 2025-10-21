<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">Create Server</h2>
        <p class="modal-subtitle">Give your new server a personality with a name and an icon. You can always change it later.</p>
      </div>

      <div class="modal-content">
        <div class="server-preview">
          <div class="server-icon">
            <q-icon name="add" size="32px" />
          </div>
          <div class="server-details">
            <q-input
              v-model="serverName"
              label="Server name"
              filled
              color="primary"
              bg-color="grey-10"
              dark
              class="server-name-input"
              placeholder="Enter server name"
            />
            <div class="server-type">
              <q-radio v-model="serverType" val="public" label="Public" color="primary" />
              <q-radio v-model="serverType" val="private" label="Private" color="primary" />
            </div>
          </div>
        </div>

        <div class="existing-servers">
          <h3 class="section-title">Join Existing Server</h3>
          <q-input
            v-model="search"
            rounded
            outlined
            dense
            label="Search servers..."
            bg-color="grey-9"
            standout="bg-grey-9 text-white"
            input-class="text-white"
            class="search-input"
          >
            <template #prepend>
              <q-icon name="search" color="grey-5" />
            </template>
          </q-input>
          
          <div class="server-list">
            <div
              v-for="c in filtered"
              :key="c.id"
              @click="open(c.id)"
              class="server-item"
            >
              <div class="server-item-icon">
                <q-icon :name="c.isPrivate ? 'lock' : 'public'" size="20px" />
              </div>
              <div class="server-item-info">
                <div class="server-item-name">{{ c.channelName }}</div>
                <div class="server-item-meta">
                  {{ c.members.length }} members • {{ c.isPrivate ? 'Private' : 'Public' }}
                </div>
              </div>
              <q-icon name="arrow_forward_ios" size="16px" color="grey-5" />
            </div>
            
            <div v-if="!filtered.length" class="empty-servers">
              <q-icon name="search_off" size="32px" />
              <span>No servers found</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <q-btn flat label="Cancel" color="grey-5" @click="goBack" />
        <q-btn 
          unelevated 
          label="Create Server" 
          color="primary" 
          :disable="!serverName.trim()"
          @click="createServer"
        />
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChannelStore } from '../stores/channel-store';
import { useRouter } from 'vue-router';

const store = useChannelStore();
const router = useRouter();

const search = ref('');
const serverName = ref('');
const serverType = ref('public');

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return store.channels;
  return store.channels.filter(c =>
    c.channelName.toLowerCase().includes(q)
  );
});

function open(id: string) {
  void router.push({ name: 'chat', params: { channelId: id } });
}

function goBack() {
  void router.push('/app');
}

function createServer() {
  if (!serverName.value.trim()) return;
  
  // TODO: Implement server creation logic
  console.log('Creating server:', {
    name: serverName.value,
    type: serverType.value
  });
  
  // For now, just go back
  goBack();
}
</script>
  
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: rgba(24, 26, 31, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 32px 32px 16px;
  text-align: center;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0 0 8px;
}

.modal-subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
}

.modal-content {
  flex: 1;
  padding: 0 32px;
  overflow-y: auto;
}

.server-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  margin-bottom: 24px;
}

.server-icon {
  width: 60px;
  height: 60px;
  background: rgba(88, 101, 242, 0.2);
  border: 2px solid rgba(88, 101, 242, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b93f9;
  flex-shrink: 0;
}

.server-details {
  flex: 1;
}

.server-name-input {
  margin-bottom: 16px;
}

.server-type {
  display: flex;
  gap: 16px;
}

.existing-servers {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0 0 16px;
}

.search-input {
  margin-bottom: 16px;
}

.server-list {
  max-height: 200px;
  overflow-y: auto;
}

.server-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  margin-bottom: 4px;
}

.server-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.server-item-icon {
  width: 40px;
  height: 40px;
  background: rgba(88, 101, 242, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b93f9;
  flex-shrink: 0;
}

.server-item-info {
  flex: 1;
}

.server-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #e5e7eb;
  margin-bottom: 2px;
}

.server-item-meta {
  font-size: 12px;
  color: #9ca3af;
}

.empty-servers {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: #9ca3af;
  text-align: center;
}

.modal-actions {
  padding: 20px 32px 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

/* Scrollbar styling */
.server-list::-webkit-scrollbar {
  width: 6px;
}

.server-list::-webkit-scrollbar-track {
  background: transparent;
}

.server-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

.server-list::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>
  