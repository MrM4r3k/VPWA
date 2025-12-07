<template>
  <footer v-if="active" class="chat-footer">
    <div class="composer-bar">
      <div class="composer-actions-left">
        <q-btn 
          round 
          unelevated 
          color="purple" 
          icon="notifications" 
          @click="showTestNotif"
          size="sm"
        />
      </div>

      <q-input
        v-model="text"
        borderless
        autogrow
        placeholder="Send a message"
        input-class="text-white"
        class="composer-input"
        :disable="hasPendingInvite"
        @keydown.enter.prevent="onEnter"
        @input="onInput"
      />

      <div class="composer-actions-right">
        <q-btn :disable="!canSend || hasPendingInvite" round unelevated color="primary" icon="send" @click="submit" />
      </div>
    </div>
  </footer>
</template>
  
  <script setup lang="ts">
import { computed,ref } from 'vue'
import { useQuasar } from 'quasar'
import { useChannelStore, type Channel } from 'src/stores/channel-store'
import { api } from 'boot/axios'
  
  const channels = useChannelStore()
  const $q = useQuasar()
  const active = computed<Channel | null>(() => channels.activeChannel)
  const text = ref('')
  const cmdMenu = ref(false)
  const canSend = computed(() => !!text.value.trim())
  const hasPendingInvite = computed(() => active.value?.isInvited === true)
  
  const emit = defineEmits<{
  (e: 'submit', payload: { text: string; channelId: string }): void
  (e: 'showMembers'): void
}>()

  function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) return // povolíme nový riadok
  
  const command = text.value.trim()
  
  // Check for /list command before submitting
  if (command === '/list') {
    emit('showMembers')
    text.value = ''
    return
  }
  
  // /join channelName [private]
  const joinMatch = command.match(/^\/join\s+(\S+)(?:\s+(private))?/i)
  if (joinMatch) {
    const channelName = joinMatch[1] ?? ''
    const isPrivate = joinMatch[2]?.toLowerCase() === 'private'
    void handleJoin(channelName, isPrivate)
    return
  }
  
  // /cancel - opustit kanál
  if (command === '/cancel') {
    void handleCancel()
    return
  }
  
  // /quit - zrušit kanál (jen owner)
  if (command === '/quit') {
    void handleQuit()
    return
  }
  
 // /promote <nick>
 const promoteMatch = command.match(/^\/promote\s+(@?)(\S+)/i)
 if (promoteMatch) {
  const nick = promoteMatch[2] ?? ''
  void handlePromote(nick)
   return
 }

// /kick <nick>
const kickMatch = command.match(/^\/kick\s+(@?)(\S+)/i)
if (kickMatch) {
  const nick = kickMatch[2] ?? ''
  void handleKick(nick)
  return
}

// /invite <nick>
const inviteMatch = command.match(/^\/invite\s+(@?)(\S+)/i)
if (inviteMatch) {
  const nick = inviteMatch[2] ?? ''
  void handleInvite(nick)
  return
}

// /revoke <nick>
const revokeMatch = command.match(/^\/revoke\s+(@?)(\S+)/i)
if (revokeMatch) {
  const nick = revokeMatch[2] ?? ''
  void handleRevoke(nick)
  return
}

  submit()
}

//Stráži, či je aktívny kanál a či je text neprázdny, vysiela event do rodiča, vyčistí input.
function submit() {
  if (!active.value || hasPendingInvite.value) return
  const val = text.value.trim()
  if (!val) return
  emit('submit', { text: val, channelId: active.value.id })
  text.value = ''
  cmdMenu.value = false
}
//Keď používateľ napíše /list, vyvolajú sa členovia
function onInput() {
  cmdMenu.value = text.value.trim().startsWith('/')
  
  // Check for /list command
  if (text.value.trim() === '/list') {
    emit('showMembers')
    text.value = '' // Clear the input after showing popup
  }
}

async function handlePromote(nick: string) {
  if (!active.value) return
  const cleanNick = nick.replace(/^@/, '').trim()
  if (!cleanNick) return
  try {
    await api.post(`/api/channels/${active.value.id}/promote`, { nick: cleanNick })
    await channels.fetchChannels()
    $q.notify({
      type: 'positive',
      message: `Promoted ${cleanNick} to owner`,
      position: 'top',
    })
  } catch (error: unknown) {
    console.error('Promote failed:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'Failed to promote'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
    })
  } finally {
    text.value = ''
  }
}

async function handleKick(nick: string) {
  if (!active.value) return
  const cleanNick = nick.replace(/^@/, '').trim()
  if (!cleanNick) return
  try {
    const response = await api.post(`/api/channels/${active.value.id}/kick`, { nick: cleanNick })
    await channels.fetchChannels()
    $q.notify({
      type: 'info',
      message: response.data.message || `Removed ${cleanNick} from group`,
      position: 'top',
    })
  } catch (error: unknown) {
    console.error('Kick failed:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'Failed to remove member'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
    })
  } finally {
    text.value = ''
  }
}

async function handleJoin(channelName: string, isPrivate: boolean) {
  if (!channelName) return
  try {
    const response = await api.post('/api/channels/join', {
      channelName,
      private: isPrivate,
    })
    await channels.fetchChannels()
    $q.notify({
      type: 'positive',
      message: response.data.message || `Joined ${channelName}`,
      position: 'top',
    })
    // If channel was created or joined, navigate to it
    if (response.data.channelId) {
      // Could navigate to the channel here if needed
    }
  } catch (error: unknown) {
    console.error('Join failed:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'Failed to join channel'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
    })
  } finally {
    text.value = ''
  }
}

async function handleCancel() {
  if (!active.value) return
  try {
    await api.post(`/api/channels/${active.value.id}/cancel`)
    await channels.fetchChannels()
    $q.notify({
      type: 'info',
      message: 'Left channel',
      position: 'top',
    })
    // Navigate away if channel was deleted
    const stillThere = channels.channels.find(c => c.id === active.value?.id)
    if (!stillThere) {
      // Channel was deleted, navigate to /app
      window.location.href = '/app'
    }
  } catch (error: unknown) {
    console.error('Cancel failed:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'Failed to leave channel'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
    })
  } finally {
    text.value = ''
  }
}

async function handleQuit() {
  if (!active.value) return
  try {
    await api.post(`/api/channels/${active.value.id}/quit`)
    await channels.fetchChannels()
    $q.notify({
      type: 'info',
      message: 'Channel deleted',
      position: 'top',
    })
    // Navigate away since channel was deleted
    window.location.href = '/app'
  } catch (error: unknown) {
    console.error('Quit failed:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'Failed to delete channel'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
    })
  } finally {
    text.value = ''
  }
}

async function handleInvite(nick: string) {
  if (!active.value) return
  const cleanNick = nick.replace(/^@/, '').trim()
  if (!cleanNick) return
  try {
    await api.post(`/api/channels/${active.value.id}/invite`, { nick: cleanNick })
    await channels.fetchChannels()
    $q.notify({
      type: 'positive',
      message: `Invited ${cleanNick} to channel`,
      position: 'top',
    })
  } catch (error: unknown) {
    console.error('Invite failed:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'Failed to invite user'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
    })
  } finally {
    text.value = ''
  }
}

async function handleRevoke(nick: string) {
  if (!active.value) return
  const cleanNick = nick.replace(/^@/, '').trim()
  if (!cleanNick) return
  try {
    await api.post(`/api/channels/${active.value.id}/revoke`, { nick: cleanNick })
    await channels.fetchChannels()
    $q.notify({
      type: 'info',
      message: `Removed ${cleanNick} from channel`,
      position: 'top',
    })
  } catch (error: unknown) {
    console.error('Revoke failed:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const msg = err.response?.data?.message || 'Failed to revoke user'
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
    })
  } finally {
    text.value = ''
  }
}

//Notifikácia
function showTestNotif() {
  $q.notify({
    message: 'Mike',
    caption: 'Hey, how re u?',
    color: 'white',
    textColor: 'white',
    classes: 'custom-notification',
    html: true,
    position: 'bottom-left'
  })
}
  </script>
  
<style scoped>
  .chat-footer {
    position: fixed;
    bottom: 0;
    left: 320px; /* Account for left sidebar width */
    right: 0; /* No right sidebar */
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

  .composer-input :deep(.q-field--disabled) {
    opacity: 0.5;
  }

  /* Responsive design */

  @media (max-width: 768px) {
    .chat-footer {
      left: 0; /* Remove left sidebar offset */
      right: 0;
      padding: 8px 12px;
    }
    
    .composer-bar {
      padding: 4px 8px;
      gap: 6px;
    }
    
    .composer-input {
      min-height: 32px;
    }
  }

  @media (max-width: 480px) {
    .chat-footer {
      padding: 6px 8px;
    }
    
    .composer-bar {
      padding: 3px 6px;
      gap: 4px;
    }
    
    .composer-input {
      min-height: 28px;
    }
    
    .composer-actions-left, .composer-actions-right {
      gap: 4px;
    }
  }
</style>
  