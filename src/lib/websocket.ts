import type { Message } from "@/types"

type MessageHandler = (message: Message) => void
type ConnectionStatusHandler = (status: "connected" | "disconnected" | "error") => void

class WebSocketService {
  private socket: WebSocket | null = null
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private statusHandlers: Set<ConnectionStatusHandler> = new Set()
  private reconnectTimer: NodeJS.Timeout | null = null
  private url: string
  private userId: string | null = null
  private token: string | null = null

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"
  }

  public setCredentials(userId: string, token: string) {
    this.userId = userId
    this.token = token
  }

  public connect(chatId: string): void {
    if (!this.userId) {
      console.error("Cannot connect: userId not set")
      return
    }

    // Close existing connection if any
    this.disconnect()

    try {
      // Create WebSocket connection with authentication
      this.socket = new WebSocket(`${this.url}/ws/${chatId}?user_id=${this.userId}&token=${this.token}`)

      this.socket.onopen = () => {
        console.log(`WebSocket connected to chat ${chatId}`)
        this.notifyStatusChange("connected")
      }

      this.socket.onmessage = (event) => {
        try {
          const text = event.data.trim()
      
          // Handle typing events
          if (text.startsWith("TYPING:") || text.startsWith("STOP_TYPING:")) {
            const message: Message = {
              id: Date.now().toString(),
              author: "system",
              content: text,
              timestamp: new Date().toISOString(),
              edited: false,
              deleted: false,
            }
            this.notifyMessageHandlers(chatId, message)
            return
          }
      
          // New format: JSON
          if (text.startsWith("{")) {
            const raw = JSON.parse(text)
      
            // Ignore if the message is sent by this user
            if (raw.author === this.userId) return
      
            const message: Message = {
              id: raw.id,
              author: raw.author,
              content: raw.content,
              timestamp: raw.timestamp,
              edited: raw.edited || false,
              deleted: raw.deleted || false,
            }
      
            this.notifyMessageHandlers(chatId, message)
            return
          }
      
          // Fallback: legacy "userId: message"
          const colonIndex = text.indexOf(":")
          if (colonIndex > 0) {
            const author = text.substring(0, colonIndex).trim()
            const content = text.substring(colonIndex + 1).trim()
      
            if (author === this.userId) return
      
            const message: Message = {
              id: Date.now().toString(),
              author,
              content,
              timestamp: new Date().toISOString(),
              edited: false,
              deleted: false,
            }
      
            this.notifyMessageHandlers(chatId, message)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }      

      this.socket.onclose = () => {
        console.log("WebSocket disconnected")
        this.notifyStatusChange("disconnected")
        this.scheduleReconnect(chatId)
      }

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        this.notifyStatusChange("error")
      }
    } catch (error) {
      console.error("Error creating WebSocket:", error)
      this.notifyStatusChange("error")
      this.scheduleReconnect(chatId)
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  public sendMessage(content: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message: WebSocket not connected")
      return false
    }

    if (!this.userId) {
      console.error("Cannot send message: user ID not set")
      return false
    }

    try {
      const payload = JSON.stringify({
        type: "chat",
        content,
        author: this.userId,
        timestamp: new Date().toISOString(),
      })

      this.socket.send(payload)
      return true
    } catch (error) {
      console.error("Error sending message:", error)
      return false
    }
  }

  public subscribeToMessages(chatId: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(chatId)) {
      this.messageHandlers.set(chatId, new Set())
    }

    this.messageHandlers.get(chatId)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(chatId)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(chatId)
        }
      }
    }
  }

  public subscribeToConnectionStatus(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.add(handler)

    // Return unsubscribe function
    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  private notifyMessageHandlers(chatId: string, message: Message): void {
    const handlers = this.messageHandlers.get(chatId)
    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }
  }

  private notifyStatusChange(status: "connected" | "disconnected" | "error"): void {
    this.statusHandlers.forEach((handler) => handler(status))
  }

  private scheduleReconnect(chatId: string): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectTimer = setTimeout(() => {
      console.log("Attempting to reconnect WebSocket...")
      this.connect(chatId)
    }, 5000) // Reconnect after 5 seconds
  }

  public sendTyping(chatId: string, username: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(`TYPING:${chatId}:${username}`)
    }
  }

  public sendStopTyping(chatId: string, username: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(`STOP_TYPING:${chatId}:${username}`)
    }
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService()
export default webSocketService
