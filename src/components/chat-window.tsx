"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message, User, Group } from "@/types"

interface ChatWindowProps {
  messages: Message[]
  currentUser: User
  activeChat: { type: "user" | "group"; id: string } | null
  users: User[]
  groups: Group[]
}

export function ChatWindow({ messages, currentUser, activeChat, users, groups }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Get the name of the active chat
  const getActiveChatName = () => {
    if (!activeChat) return "Select a chat"

    if (activeChat.type === "user") {
      const user = users.find((u) => u.id === activeChat.id)
      return user ? user.username : "Unknown user"
    } else {
      const group = groups.find((g) => g.id === activeChat.id)
      return group ? group.name : "Unknown group"
    }
  }

  // Get the username for a user ID
  const getUserName = (userId: string) => {
    if (userId === currentUser.id) return "You"
    const user = users.find((u) => u.id === userId)
    return user ? user.username : "Unknown user"
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-black/10 dark:border-white/10 bg-white/5 dark:bg-black/5">
        <h2 className="text-lg font-semibold">{getActiveChatName()}</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {activeChat ? (
          messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.from === currentUser.id

                return (
                  <div key={index} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isCurrentUser
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-black/10 dark:bg-white/10"
                      }`}
                    >
                      {!isCurrentUser && activeChat.type === "group" && (
                        <div className="text-xs font-semibold mb-1">{getUserName(message.from)}</div>
                      )}
                      <div>{message.content}</div>
                      <div className="text-xs opacity-70 text-right mt-1">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-black/40 dark:text-white/40">
              No messages yet. Start the conversation!
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-black/40 dark:text-white/40">
            Select a user or group to start chatting
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
