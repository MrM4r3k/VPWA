import { EventEmitter } from 'node:events'

type MessageNewPayload = {
  channelId: number
  message: unknown
}

type TypingPayload = {
  channelId: number
  userId: number
  nickName: string
}

type ChannelRefreshPayload = {
  userId: number
}

type UserStatusChangedPayload = {
  userId: number
  status: 'online' | 'DND' | 'offline'
}

type EventMap = {
  'message:new': MessageNewPayload
  'typing': TypingPayload
  'channel:refresh': ChannelRefreshPayload
  'user:status:changed': UserStatusChangedPayload
}

class RealtimeBus extends EventEmitter {
  emit<T extends keyof EventMap>(event: T, payload: EventMap[T]): boolean {
    return super.emit(event, payload)
  }

  on<T extends keyof EventMap>(event: T, listener: (payload: EventMap[T]) => void): this {
    return super.on(event, listener)
  }
}

export const realtimeBus = new RealtimeBus()

