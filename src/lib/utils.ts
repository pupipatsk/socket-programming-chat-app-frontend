import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
}

export function getUserName(userId: string, currentUser: any, users: any[]): string {
  if (userId === currentUser.id) return "You"
  const user = users.find((u) => u.id === userId)
  return user ? user.username : "Unknown User"
}

export function isUserInGroup(userId: string, group: any): boolean {
  return group.members.includes(userId)
}

export function groupMessagesByDate(messages: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {}

  messages.forEach((message) => {
    const date = new Date(message.timestamp).toDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(message)
  })

  return grouped
}

// Detect if device is touch-enabled
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}

// Get viewport dimensions
export function getViewportDimensions() {
  if (typeof window === "undefined") return { width: 0, height: 0 }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

// Safe area insets for mobile devices
export function getSafeAreaInsets() {
  if (typeof window === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 }

  const computedStyle = getComputedStyle(document.documentElement)

  return {
    top: Number.parseInt(computedStyle.getPropertyValue("--sat") || "0", 10),
    right: Number.parseInt(computedStyle.getPropertyValue("--sar") || "0", 10),
    bottom: Number.parseInt(computedStyle.getPropertyValue("--sab") || "0", 10),
    left: Number.parseInt(computedStyle.getPropertyValue("--sal") || "0", 10),
  }
}
