// src/components/chat-window.tsx
"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { Message, User, GroupChat } from "@/types"

interface ChatWindowProps {
  messages: Message[]
  currentUser: User
  activeChat: { type: "private_chat" | "group"; id: string } | null
  users: User[]
  groups: GroupChat[]
  isLoading: boolean
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
}

export function ChatWindow({
  messages,
  currentUser,
  activeChat,
  users,
  groups,
  onEditMessage,
  onDeleteMessage,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const getActiveChatName = () => {
    if (!activeChat) return "Select a chat"

    if (activeChat.type === "private_chat") {
      const user = users.find((u) => u.id === activeChat.id)
      return user ? user.username : "Unknown user"
    } else {
      const group = groups.find((g) => g.id === activeChat.id)
      return group ? group.name : "Unknown group"
    }
  }

  const getUserName = (userId: string) => {
    if (userId === currentUser.id) return "You"
    const user = users.find((u) => u.id === userId)
    return user ? user.username : "Unknown user"
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (timestamp: string) => {
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

  const handleStartEdit = (message: Message) => {
    setEditingMessage(message.id)
    setEditContent(message.content)
  }

  const handleSaveEdit = () => {
    if (editingMessage && editContent.trim()) {
      onEditMessage(editingMessage, editContent.trim())
      setEditingMessage(null)
      setEditContent("")
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditContent("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  // Group messages by date for better display
  const messagesByDate = messages.reduce<Record<string, Message[]>>((groups, message) => {
    const date = new Date(message.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-black/10 bg-white/5">
        <h2 className="text-lg font-semibold">{getActiveChatName()}</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {activeChat ? (
          messages.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                <div key={date} className="space-y-2">
                  <div className="text-center text-xs text-black/40 my-2">{formatDate(dateMessages[0].timestamp)}</div>
                  {dateMessages.map((message) => {
                    const isCurrentUser = message.author === currentUser.id
                    const isDeleted = message.deleted
                    const canModify = isCurrentUser && !isDeleted

                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] p-4 rounded-2xl shadow-sm backdrop-blur-md ${
                            isCurrentUser
                              ? "bg-black/80 text-white rounded-br-none"
                              : "bg-gray-200/30 text-black border border-white/20 rounded-bl-none"
                          }`}
                        >
                          {!isCurrentUser && activeChat.type === "group" && (
                            <div className="text-xs font-semibold mb-1">{getUserName(message.author)}</div>
                          )}

                          {editingMessage === message.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="min-h-[60px] text-black"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-7 px-2 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveEdit} className="h-7 px-2 text-xs">
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className={`${isDeleted ? "italic text-black/50" : ""}`}>
                              {isDeleted ? "[Message deleted]" : message.content}
                            </div>
                          )}

                          <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end">
                            {formatTime(message.timestamp)}
                            {message.edited && !message.deleted && <span className="ml-1">(edited)</span>}

                            {canModify && !editingMessage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleStartEdit(message)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDeleteMessage(message.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-black/40">
              No messages yet. Start the conversation!
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-black/40">
            Select a user or group to start chatting
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
