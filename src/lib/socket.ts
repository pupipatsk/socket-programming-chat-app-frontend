import { io, type Socket } from "socket.io-client"
import type { User } from "@/types"

let socket: Socket | null = null

export const initializeSocket = (user: User) => {
  if (socket) return socket

  socket = io("http://localhost:8000", {
    query: {
      userId: user.id,
      username: user.username,
    },
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.")
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
