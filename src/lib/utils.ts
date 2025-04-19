import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User, Message, GroupChat } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

export function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
}

export function formatDate(timestamp: string) {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
}

export function getUserName(userId: string, currentUser: User, users: User[]) {
  if (userId === currentUser.id) return "You"
  const user = users.find((u) => u.id === userId)
  return user ? user.username : "Unknown User"
}

export function groupMessagesByDate(messages: Message[]) {
  const grouped: Record<string, Message[]> = {}

  messages.forEach((message) => {
    const date = new Date(message.timestamp).toDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(message)
  })

  return grouped
}

export function isUserInGroup(userId: string, group: GroupChat) {
  return group.members.includes(userId)
}
