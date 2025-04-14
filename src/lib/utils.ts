import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { GroupChat, User } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUserInGroup(userId: string, group: GroupChat): boolean {
  return group.members.includes(userId)
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString()
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function getUserName(userId: string, currentUser: User, users: User[]): string {
  if (userId === currentUser.id) return "You"
  const user = users.find((u) => u.id === userId)
  return user ? user.username : "Unknown user"
}

export function groupMessagesByDate(messages: any[]) {
  return messages.reduce<Record<string, any[]>>((groups, message) => {
    const date = new Date(message.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})
}
