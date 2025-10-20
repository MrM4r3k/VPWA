<template>
    <footer v-if="active" class="chat-footer">
      <q-input 
      rounded
      v-model="text" 
      label="Text" 
      label-color="white"
      dense
      standout="text-white bg-transparent"
      input-class="text-white"
      autogrow
        overflow = "auto"
        input-style="max-height:120px; overflow:auto; line-height:1.35; position:absolute; bottom: 1px"
        @keydown.enter.prevent="onEnter"
        @input="onInput"
        style="width: 1040px;
              margin: 20px;
              border-radius: 20px">

          <template v-slot:after>
            <q-btn 
            round 
            dense 
            flat 
            icon="send" 
            color="white" 
            :disable="!canSend" 
            @click="submit"/>
          </template>
        </q-input>
    </footer>
</template>
  
  <script setup lang="ts">
  import { computed,ref } from 'vue'
  import { useChannelStore, type Channel } from 'src/stores/chat-store'
  
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
    background:#1a1d2e; 
    height:80px; 
    display:flex; 
    padding:0 16px; 
    border-top:1px solid #374151;
}
  
</style>
  