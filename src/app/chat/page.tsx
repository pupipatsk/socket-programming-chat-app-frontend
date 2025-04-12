"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatLayout } from "@/components/chat-layout"
import { ChatWindow } from "@/components/chat-window"
import { UserList } from "@/components/user-list"
import { GroupList } from "@/components/group-list"
import { ChatInput } from "@/components/chat-input"
import { mockApi } from "@/lib/mock-api"
import type { User, Group, Message } from "@/types"

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [activeChat, setActiveChat] = useState<{ type: "user" | "group"; id: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)

    // Load initial data
    const loadInitialData = async () => {
      try {
        const [activeUsers, allGroups] = await Promise.all([mockApi.getActiveUsers(), mockApi.getGroups()])

        setUsers(activeUsers)
        setGroups(allGroups)
      } catch (error) {
        console.error("Failed to load initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [router])

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat || !user) return

    const loadMessages = async () => {
      setIsLoading(true)
      try {
        let chatMessages: Message[] = []

        if (activeChat.type === "user") {
          chatMessages = await mockApi.getPrivateMessages(user.id, activeChat.id)
        } else {
          chatMessages = await mockApi.getGroupMessages(activeChat.id)
        }

        setMessages(chatMessages)
      } catch (error) {
        console.error("Error loading messages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [activeChat, user])

  const handleSendMessage = async (content: string) => {
    if (!activeChat || !user) return

    try {
      const messageData = {
        content,
        from: user.id,
        to: activeChat.id,
        timestamp: new Date().toISOString(),
        type: activeChat.type === "user" ? "private" : "group",
      }

      let newMessage: Message

      if (activeChat.type === "user") {
        newMessage = await mockApi.sendPrivateMessage(messageData)
      } else {
        newMessage = await mockApi.sendGroupMessage(messageData)
      }

      setMessages((prev) => [...prev, newMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleCreateGroup = async (name: string) => {
    if (!user) return

    try {
      const newGroup = await mockApi.createGroup(name, user.id)
      setGroups((prev) => [...prev, newGroup])
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return

    try {
      await mockApi.joinGroup(groupId, user.id)

      // Refresh groups list
      const updatedGroups = await mockApi.getGroups()
      setGroups(updatedGroups)
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-light">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <ChatLayout user={user} onLogout={handleLogout}>
      <div className="flex h-full">
        <div className="w-64 border-r border-black/5 p-4 space-y-6 glass">
          <UserList
            users={users}
            currentUser={user}
            onSelectUser={(userId) => setActiveChat({ type: "user", id: userId })}
            activeChat={activeChat}
          />
          <GroupList
            groups={groups}
            onSelectGroup={(groupId) => setActiveChat({ type: "group", id: groupId })}
            onCreateGroup={handleCreateGroup}
            onJoinGroup={handleJoinGroup}
            activeChat={activeChat}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <ChatWindow
            messages={messages}
            currentUser={user}
            activeChat={activeChat}
            users={users}
            groups={groups}
            isLoading={isLoading}
          />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </ChatLayout>
  )
}
