declare module 'ws' {
  export type RawData = any
  export type WebSocket = any

  export class WebSocketServer {
    constructor(options: any)
    on(event: string, listener: (...args: any[]) => void): void
  }
}
