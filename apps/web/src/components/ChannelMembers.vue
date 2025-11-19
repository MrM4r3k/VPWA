<template>
  <div v-if="isVisible" class="popup-overlay" @click="onHide">
    <q-card dark bordered class="popup-card" @click.stop>
      
      <!-- HEADER + button to close -->
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
          <!--Pre každý objekt m v poli filteredMembers vykreslí položku q-item-->
          <!--:key="m.id" je unikátny identifikátor pre každý objekt m v poli filteredMembers-->
          <q-item
            v-for="m in filteredMembers"
            :key="m.id"
          >
            <!-- Ľavá časť s avatarom -->
            <q-item-section avatar>
              <div class="avatar-container">
                <q-avatar size="40px" color="primary" text-color="white">
                  {{ initials(m.name) }}
                </q-avatar>
                <div 
                  class="status-dot" 
                  :class="`status-dot--${m.status}`"
                ></div>
              </div>
            </q-item-section>

            <!-- Meno nickName a status -->
            <q-item-section>
              <q-item-label class="text-white">
                {{ m.name }}
                <!-- Ikona kráľa pre majiteľa skupiny -->
                <q-icon v-if="isOwner(m)" class="text-amber" name="mdi-crown" size="20px" />
              </q-item-label>
              <!-- Caption je menšia časť textu pod menom -->
              <q-item-label caption class="text-grey-5">
                @{{ m.nickName }} - {{ m.status }} <!-- Status je online, offline alebo DND -->
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

// Prop je visible (true/false), či má byť popup otvorený.
const props = defineProps<{
  visible: boolean
}>()

// Emit je update:visible (true/false), či má byť popup otvorený.
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void 
}>()

const channels = useChannelStore()

// Umožní používať visible ako boolean v template, computed je na stále prepočítavanie
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Hľadanie členov
const search = ref('')

// Zobrazuj len členov aktívnej skupiny
const activeMembers = computed<Member[]>(() => channels.activeMembers)

//Filtrované pole členov
const filteredMembers = computed<Member[]>(() => {           
  //Aktuálny text + trim - odstáni medzeri + zmení na malé písmená             
  const q = search.value.trim().toLowerCase()
  if (!q) return activeMembers.value
  //Prejde každý prvok a ak je true tak sa dá do výsledného poľa
  return activeMembers.value.filter(m =>
    m.name.toLowerCase().includes(q) || m.nickName.toLowerCase().includes(q) //Zmení to na malé písmená + či obsahuje podreťazec q
  )
})

//Id vlastníka skupiny
const ownerId = computed(() => channels.activeChannel?.ownerId ?? null)

//Vytiahne prvé písmená z prvých dvoch slov mena, zloží a dá do UPPERCASE
function initials(name: string) {
  const p = name.trim().split(/\s+/) // regex - rozdelí meno na jednotlivé slová bez ohľadu na počet medzier
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() //Prvé písmeno z mena a prvé z druhého mena
}

function onHide() {
  // Reset form
  search.value = ''
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

/* Avatar container with status dot */
.avatar-container {
  position: relative;
  display: inline-block;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(11, 13, 16, 0.95);
  box-sizing: border-box;
}

.status-dot--online {
  background-color: #4caf50; /* Green for online */
}

.status-dot--offline {
  background-color: #9ca3af; /* Gray for offline */
}

.status-dot--DND {
  background-color: #f44336; /* Red for do not disturb */
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
