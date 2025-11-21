<template>
  <div v-if="isVisible" class="popup-overlay" @click="onHide">
    <q-card dark bordered class="popup-card" @click.stop>
      <q-card-section class="popup-header">
        <div>
          <div class="title">Typing Preview</div>
          <div class="subtitle">See what teammates are drafting in real time</div>
        </div>
        <q-btn flat round icon="close" color="grey-5" @click="onHide" />
      </q-card-section>

      <q-separator dark />

      <q-scroll-area class="popup-scroll">
        <q-list class="bg-transparent q-pa-sm">
          <q-item
            v-for="person in previewPeople"
            :key="person.id"
            class="typing-item"
          >
            <q-item-section avatar>
              <div class="avatar-wrapper">
                <q-avatar size="44px" color="primary" text-color="white">
                  {{ initials(person.name) }}
                </q-avatar>
                <span class="pulse-dot"></span>
              </div>
            </q-item-section>

            <q-item-section>
              <q-item-label class="name-row">
                <span class="name">{{ person.name }}</span>
              </q-item-label>
              <q-item-label caption class="nick">
                @{{ person.nick }}
              </q-item-label>

              <div class="draft-preview">
                <span class="draft-text">{{ person.text }}</span>
                <span class="draft-cursor" />
              </div>
            </q-item-section>
          </q-item>

          <div v-if="!previewPeople.length" class="empty-state">
            <q-icon name="sym_o_forum" size="36px" color="grey-5" />
            <div class="empty-title">No one is typing right now</div>
            <div class="empty-caption">
              Once someone starts a draft, the live preview will appear here.
            </div>
          </div>
        </q-list>
      </q-scroll-area>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TypingPerson = {
  id: string
  name: string
  nick: string
  text: string
}

const props = defineProps<{
  visible: boolean
  people: TypingPerson[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const isVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const previewPeople = computed(() => props.people ?? [])

function onHide() {
  emit('update:visible', false)
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 10002;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
}

.popup-card {
  width: 440px;
  max-width: 92vw;
  max-height: 85vh;
  border-radius: 20px;
  background: radial-gradient(220px 200px at 10% -20%, rgba(88, 101, 242, 0.22), transparent),
    radial-gradient(180px 160px at 120% 120%, rgba(32, 34, 37, 0.45), transparent),
    rgba(11, 13, 16, 0.95);
  border: 1px solid rgba(88, 101, 242, 0.35);
  box-shadow: 0 25px 40px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #f5f7ff;
}

.subtitle {
  font-size: 13px;
  color: #b6bce4;
}

.popup-scroll {
  height: 360px;
}

.typing-item {
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(24, 26, 31, 0.8);
  border: 1px solid rgba(88, 101, 242, 0.12);
}

.avatar-wrapper {
  position: relative;
  display: inline-flex;
}

.pulse-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8b93f9;
  box-shadow: 0 0 0 0 rgba(139, 147, 249, 0.7);
  animation: pulse 1.6s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(139, 147, 249, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(139, 147, 249, 0);
  }
  100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(139, 147, 249, 0);
  }
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-weight: 600;
  color: #f8f9ff;
}

.nick {
  color: #9da2c5;
}

.draft-preview {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 17, 22, 0.85);
  border: 1px solid rgba(88, 101, 242, 0.15);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: #e7e9ff;
  position: relative;
}

.draft-text {
  white-space: pre-wrap;
}

.draft-cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: #8b93f9;
  margin-left: 4px;
  animation: blink 1s steps(1) infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 40px 20px;
  color: #b0b6d6;
}

.empty-title {
  font-weight: 600;
  color: #f1f3ff;
}

.empty-caption {
  font-size: 13px;
  max-width: 260px;
}

@media (max-width: 520px) {
  .popup-card {
    width: 100%;
    max-width: 100%;
    border-radius: 16px;
  }

  .progress-track {
    width: 100px;
  }
}
</style>

