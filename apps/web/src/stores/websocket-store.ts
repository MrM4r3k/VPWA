import { defineStore } from 'pinia'

export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    isConnected: false,
    isConnecting: false,
  }),
  getters: {
    status(): 'online' | 'offline' | 'connecting' {
      if (this.isConnecting) return 'connecting'
      return this.isConnected ? 'online' : 'offline'
    },
    statusColor(): string {
      if (this.isConnecting) return 'yellow'
      return this.isConnected ? 'green' : 'red'
    },
    statusText(): string {
      if (this.isConnecting) return 'Connecting...'
      return this.isConnected ? 'Online' : 'Offline'
    },
  },
  actions: {
    setConnected(value: boolean) {
      this.isConnected = value
      this.isConnecting = false
    },
    setConnecting(value: boolean) {
      this.isConnecting = value
    },
  },
})

