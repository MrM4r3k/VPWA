<template>
  <footer v-if="active" class="chat-footer">
    <div class="composer-bar">
      <div class="composer-actions-left">
      </div>

      <q-input
        v-model="text"
        borderless
        autogrow
        placeholder="Send a message"
        input-class="text-white"
        class="composer-input"
        @keydown.enter.prevent="onEnter"
        @input="onInput"
      />

      <div class="composer-actions-right">
        <q-btn :disable="!canSend" round unelevated color="primary" icon="send" @click="submit" />
      </div>
    </div>
  </footer>
</template>
  
  <script setup lang="ts">
  import { computed,ref } from 'vue'
  import { useChannelStore, type Channel } from 'src/stores/channel-store'
  
  const channels = useChannelStore()
  const active = computed<Channel | null>(() => channels.activeChannel)
  const text = ref('')
  const cmdMenu = ref(false)
  const canSend = computed(() => !!text.value.trim())
  
  const emit = defineEmits<{
  (e: 'submit', payload: { text: string; channelId: string }): void
}>()

  function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) return // povolíme nový riadok
  submit()
}
function submit() {
  if (!active.value) return
  const val = text.value.trim()
  if (!val) return
  emit('submit', { text: val, channelId: active.value.id })
  text.value = ''
  cmdMenu.value = false
}
function onInput() {
  cmdMenu.value = text.value.trim().startsWith('/')
}
  </script>
  
<style scoped>
  .chat-footer {
    position: fixed;
    bottom: 0;
    left: 320px; /* Account for left sidebar width */
    right: 280px; /* Account for right sidebar width */
    background: rgba(11, 13, 16, 0.95);
    backdrop-filter: blur(8px);
    display: flex;
    padding: 12px 16px;
    border-top: 1px solid rgba(88, 101, 242, 0.2);
    z-index: 3;
  }

  .composer-bar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    background: rgba(24, 26, 31, 0.9);
    border: 1px solid rgba(88, 101, 242, 0.15);
    border-radius: 14px;
    padding: 6px 10px;
  }

  .composer-actions-left, .composer-actions-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-ghost {
    background: rgba(74, 78, 132, 0.25);
  }

  .composer-input :deep(textarea) {
    color: #e5e7eb;
  }

  .composer-input {
    min-height: 36px;
  }
</style>
  