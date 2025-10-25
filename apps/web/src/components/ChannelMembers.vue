<template>
  <div v-if="isVisible" class="popup-overlay" @click="onHide">
    <q-card dark bordered class="popup-card" @click.stop>
      
      <!-- HEADER -->
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-white">Group Members</div>
        <q-btn 
          flat 
          round 
          icon="close" 
          color="grey-5" 
          @click="onHide"
        />
      </q-card-section>

      <q-separator dark inset />

      <!-- MEMBERS LIST -->
      <q-scroll-area style="height: 300px; max-width: 350px; padding: 12px;">
        <q-list class="bg-transparent">
          <q-item
            v-for="m in filteredMembers"
            :key="m.id"
            clickable 
            v-ripple
            @click="selectMember(m)"
          >
            <q-item-section avatar>
              <q-avatar size="40px" color="primary" text-color="white">
                {{ initials(m.name) }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-white">
                {{ m.name }}
                <q-icon v-if="isOwner(m)" class="text-amber" name="mdi-crown" size="20px" />
              </q-item-label>
              <q-item-label caption class="text-grey-5">
                @{{ m.nickName }} - {{ m.status }}
              </q-item-label>
            </q-item-section>

          </q-item>
        </q-list>
      </q-scroll-area>

    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type Member } from 'src/stores/members-store'
import { useChannelStore } from 'src/stores/channel-store'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'groupCreated', payload: { members: string[] }): void
}>()

const channels = useChannelStore()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const search = ref('')
const selectedMembers = ref<string[]>([])

// Zobrazuj len členov aktívnej skupiny
const activeMembers = computed<Member[]>(() => channels.activeMembers)

const filteredMembers = computed<Member[]>(() => {                        
  const q = search.value.trim().toLowerCase()
  if (!q) return activeMembers.value
  return activeMembers.value.filter(m =>
    m.name.toLowerCase().includes(q) || m.nickName.toLowerCase().includes(q)
  )
})

const ownerId = computed(() => channels.activeChannel?.ownerId ?? null)

function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()
}

function selectMember(member: Member) {
  const index = selectedMembers.value.indexOf(member.id)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(member.id)
  }
}

function onHide() {
  // Reset form
  search.value = ''
  selectedMembers.value = []
  emit('update:visible', false)
}

function isOwner(m: Member) {
  return ownerId.value !== null && m.id === ownerId.value
}

// Watch for visibility changes to reset form
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // Reset form when opening
    search.value = ''
    selectedMembers.value = []
  }
})
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.popup-card {
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  min-width: 375px;
  border-radius: 20px;
  background: radial-gradient(250px 200px at 10% -13%, rgba(88, 101, 242, 0.25), transparent),
              radial-gradient(100px 101px at 900% 70%, rgba(32, 34, 37, 0.3), transparent),
              #0b0d1054 !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .popup-card {
    max-width: 95vw;
    max-height: 90vh;
    margin: 10px;
  }
}
</style>
