import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User, GroupChat, Message } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok", // Force GMT+7
  });
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);

  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const messageDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return messageDate.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    });
  }
}

export function toGMT7ISOString(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  // Add 7 hours (7 * 60 * 60 * 1000 ms)
  date.setHours(date.getHours() + 7);
  return date.toISOString();
}

export function getUserName(
  userId: string,
  currentUser: User,
  users: User[]
): string {
  if (userId === currentUser.id) return "You";
  const user = users.find((u) => u.id === userId);
  return user ? user.username : "Unknown User";
}

export function isUserInGroup(userId: string, group: GroupChat): boolean {
  return group.members.includes(userId);
}

export function groupMessagesByDate(
  messages: Message[]
): Record<string, Message[]> {
  const grouped: Record<string, Message[]> = {};

  messages.forEach((message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(message);
  });

  return grouped;
}

// Detect if device is touch-enabled
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

// Get viewport dimensions
export function getViewportDimensions() {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

// Safe area insets for mobile devices
export function getSafeAreaInsets() {
  if (typeof window === "undefined")
    return { top: 0, right: 0, bottom: 0, left: 0 };

  const computedStyle = getComputedStyle(document.documentElement);

  return {
    top: Number.parseInt(computedStyle.getPropertyValue("--sat") || "0", 10),
    right: Number.parseInt(computedStyle.getPropertyValue("--sar") || "0", 10),
    bottom: Number.parseInt(computedStyle.getPropertyValue("--sab") || "0", 10),
    left: Number.parseInt(computedStyle.getPropertyValue("--sal") || "0", 10),
  };
}
