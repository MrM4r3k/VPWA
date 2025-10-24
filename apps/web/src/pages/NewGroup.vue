<template>
  <div class="page bg-gradient">
    <div class="container">
      <q-card class="card" dark bordered flat>
        <q-card-section class="header">
          <div class="title">New Group</div>
          <q-tabs v-model="tab" active-color="#8b93f9" indicator-color="#8b93f9">
            <q-tab name="search" label="Search Group" />
            <q-tab name="create" label="Create Group" />
          </q-tabs>
        </q-card-section>

        <q-card-section class="content">
          <q-tab-panels v-model="tab" class="bg-transparent text-white">
            <!-- SEARCH -->
            <q-tab-panel name="search">
              <q-input
                v-model="search"
                filled
                dense
                label="Search groups..."
                color="#8b93f9"
                bg-color="grey-10"
                dark
                class="mb-4"
              >
                <template #prepend>
                  <q-icon name="search" color="#8b93f9" />
                </template>
              </q-input>
              
              <div class="section-title mb-2">Available Groups</div>
              <q-scroll-area class="scroll-area">
                <q-list>
                  <q-item
                    v-for="c in filtered"
                    :key="c.id"
                    clickable 
                    v-ripple
                    @click="open(c.id)"
                    :class="['item', store.activeChannelId === c.id ? 'active' : '']"
                  >
                    <q-item-section avatar>
                      <q-avatar color="#8b93f9" text-color="white" size="40px">
                        {{ c.channelName.charAt(0).toUpperCase() }}
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-white">{{ c.channelName }}</q-item-label>
                      <q-item-label caption class="text-grey-5">Click to join</q-item-label>
                    </q-item-section>
                  </q-item>  
                </q-list>
              </q-scroll-area>

              <q-btn 
                color="#8b93f9" 
                flat
                label="Go Back"
                @click="goBack"
                class="btn mt-4"
              />
            </q-tab-panel>

            <!-- CREATE -->
            <q-tab-panel name="create">
              <div class="create-layout">
                <div class="left-column">
                  <q-input
                    v-model="text"
                    filled
                    dense
                    label="Group name..."
                    color="#8b93f9"
                    bg-color="grey-10"
                    dark
                    class="mb-3"
                  />
                  
                  <q-input
                    v-model="search"
                    filled
                    dense
                    label="Search contacts..."
                    color="#8b93f9"
                    bg-color="grey-10"
                    dark
                    class="mb-4"
                  >
                    <template #prepend>
                      <q-icon name="search" color="#8b93f9" />
                    </template>
                  </q-input>

                  <div class="section-title mb-2">Group Privacy</div>
                  <div class="privacy-buttons">
                    <q-btn
                      :class="['privacy-btn', panel === 'private' ? 'active' : '']"
                      @click="panel = 'private'"
                      unelevated
                      rounded
                    >
                      <q-icon name="lock" class="q-mr-sm" />
                      Private
                    </q-btn>
                    <q-btn
                      :class="['privacy-btn', panel === 'public' ? 'active' : '']"
                      @click="panel = 'public'"
                      unelevated
                      rounded
                    >
                      <q-icon name="public" class="q-mr-sm" />
                      Public
                    </q-btn>
                  </div>
                </div>

                <div class="right-column">
                  <div class="section-title mb-2">Select Members ({{ selectedMembers.length }} selected)</div>
                  <q-scroll-area class="members-scroll">
                    <q-list>
                      <q-item
                        v-for="m in filteredMembers"
                        :key="m.id"
                        clickable 
                        v-ripple
                        @click="toggleMemberSelection(m.id)"
                        class="item"
                      >
                        <q-item-section avatar>
                          <q-avatar size="36px" color="#8b93f9" text-color="white">
                            {{ initials(m.name) }}
                          </q-avatar>
                        </q-item-section>

                        <q-item-section>
                          <q-item-label class="text-white">{{ m.name }}</q-item-label>
                          <q-item-label caption class="text-grey-5">@{{ m.nickName }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-checkbox 
                            v-model="selectedMembers" 
                            :val="m.id"
                            color="#8b93f9"
                            @click.stop
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-scroll-area>
                </div>
              </div>
              
              <div class="actions">
                <q-btn 
                  color="#8b93f9" 
                  flat
                  label="Go Back"
                  @click="goBack"
                  class="btn"
                />
                <q-btn 
                  color="#8b93f9"
                  :label="`Create Group${selectedMembers.length > 0 ? ` (${selectedMembers.length})` : ''}`"
                  @click="createGroup"
                  :disable="selectedMembers.length < 2 || !panel"
                  unelevated
                  class="btn create"
                />
              </div>

              <q-banner 
                v-if="selectedMembers.length < 2 || !panel" 
                class="validation mt-3"
                rounded
              >
                <template #avatar>
                  <q-icon name="info" color="#8b93f9" />
                </template>
                Required: Group name, at least 2 members, and privacy setting
              </q-banner>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChannelStore } from '../stores/channel-store'
import { useRouter } from 'vue-router'
import { useMembersStore, type Member } from 'src/stores/members-store'
import 'src/css/auth-theme.scss'

const store = useChannelStore()
const ms = useMembersStore()
const router = useRouter()

const tab = ref<'search' | 'create'>('search')
const search = ref('')
const panel = ref('')
const text = ref('')
const selectedMembers = ref<string[]>([])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? store.channels.filter(c => c.channelName.toLowerCase().includes(q)) : store.channels
})

const allMembers = computed<Member[]>(() => Object.values(ms.byId))

const filteredMembers = computed<Member[]>(() => {                        
  const q = search.value.trim().toLowerCase()
  return q ? allMembers.value.filter(m => m.name.toLowerCase().includes(q) || m.nickName.toLowerCase().includes(q)) : allMembers.value
})

function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()
}

function open(id: string) {
  // prejdi na chat route: /app/c/:channelId
  void router.push({ name: 'chat', params: { channelId: id } })
}

function goBack() {
  void router.push('/app')
}

function toggleMemberSelection(memberId: string) {
  const index = selectedMembers.value.indexOf(memberId)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(memberId)
  }
}

function createGroup() {
  if (selectedMembers.value.length >= 2 && panel.value) {
  //potom prerobit na vytvorenie
    goBack()
  }
}


</script>
  
<style scoped>
@import 'src/css/auth-theme.scss';

.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.container {
  width: 100%;
  max-width: 800px;
}

.card {
  width: 100%;
  background: rgba(11, 13, 16, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(88, 101, 242, 0.2);
  border-radius: 14px;
  max-height: 90vh;
}

.header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(88, 101, 242, 0.2);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #8b93f9;
  text-align: center;
  margin-bottom: 16px;
}

.content {
  padding: 20px;
  min-height: 500px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #cbd5e1;
}

.scroll-area {
  height: 280px;
  border-radius: 6px;
  border: 1px solid rgba(88, 101, 242, 0.15);
}

.item {
  border-radius: 6px;
  margin: 1px 0;
  padding: 6px 12px;
  transition: all 0.15s ease;
}

.item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.item.active {
  background: rgba(88, 101, 242, 0.15);
}

.create-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}


.members-scroll {
  height: 300px;
  border-radius: 6px;
  border: 1px solid rgba(88, 101, 242, 0.15);
}

.privacy-buttons {
  display: flex;
  gap: 8px;
}

.privacy-btn {
  flex: 1;
  background: rgba(24, 26, 31, 0.5) !important;
  border: 1px solid rgba(88, 101, 242, 0.1) !important;
  color: #9ca3af !important;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.privacy-btn:hover {
  background: rgba(88, 101, 242, 0.2) !important;
  color: #8b93f9 !important;
  border-color: rgba(88, 101, 242, 0.3) !important;
}

.privacy-btn.active {
  background: rgba(88, 101, 242, 0.8) !important;
  color: white !important;
  border-color: #8b93f9 !important;
  box-shadow: 0 0 10px rgba(88, 101, 242, 0.3) !important;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(88, 101, 242, 0.2);
}

.btn {
  background: rgba(74, 78, 132, 0.25);
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: 8px;
  min-width: 100px;
}

.btn.create {
  min-width: 140px;
}

.validation {
  background: rgba(11, 13, 16, 0.95);
  border: 1px solid rgba(88, 101, 242, 0.2);
  color: #e5e7eb;
}

.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }

:deep(.q-scrollarea__thumb) {
  background: rgba(88, 101, 242, 0.5);
  border-radius: 6px;
}

:deep(.q-tabs__content) {
  border-bottom: 1px solid rgba(88, 101, 242, 0.2);
}

:deep(.q-tab) {
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
}

:deep(.q-tab--active) {
  color: #8b93f9;
}

:deep(.q-field--filled .q-field__control) {
  background: rgba(24, 26, 31, 0.9);
  border: 1px solid rgba(88, 101, 242, 0.15);
  border-radius: 14px;
}

:deep(.q-field--focused .q-field__control) {
  border-color: #8b93f9;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .page { 
    padding: 16px; 
    align-items: flex-start;
    padding-top: 20px;
    padding-bottom: 20px;
  }
  .card { max-height: none; }
  .content { 
    padding: 16px; 
    min-height: auto;
  }
  .create-layout { 
    grid-template-columns: 1fr; 
    gap: 16px;
  }
  .scroll-area { height: 240px; }
  .members-scroll { 
    height: 200px; 
    max-height: 250px;
  }
  .actions {
    position: sticky;
    bottom: 0;
    background: rgba(11, 13, 16, 0.95);
    backdrop-filter: blur(8px);
    margin: 20px -16px -16px -16px;
    padding: 20px 16px 16px 16px;
    flex-direction: column;
    gap: 8px;
  }
  .btn { width: 100%; min-width: auto; }
}

@media (max-width: 480px) {
  .page { padding: 12px; }
  .content { padding: 12px; }
  .actions {
    margin: 20px -12px -12px -12px;
    padding: 20px 12px 12px 12px;
  }
}
</style>