"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatLayout } from "@/components/chat-layout"
import { ChatWindow } from "@/components/chat-window"
import { UserList } from "@/components/user-list"
import { GroupList } from "@/components/group-list"
import { ChatInput } from "@/components/chat-input"
import { initializeSocket, disconnectSocket } from "@/lib/socket"
import type { User, Group, Message } from "@/types"

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [activeChat, setActiveChat] = useState<{ type: "user" | "group"; id: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)

    // Initialize socket connection
    const socket = initializeSocket(parsedUser)

    // Socket event listeners
    socket.on("connect", () => {
      console.log("Connected to socket server")
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setIsConnected(false)
    })

    socket.on("users", (userList: User[]) => {
      setUsers(userList)
    })

    socket.on("groups", (groupList: Group[]) => {
      setGroups(groupList)
    })

    socket.on("private_message", (message: Message) => {
      if (activeChat?.type === "user" && (activeChat.id === message.from || activeChat.id === message.to)) {
        setMessages((prev) => [...prev, message])
      }
    })

    socket.on("group_message", (message: Message) => {
      if (activeChat?.type === "group" && activeChat.id === message.to) {
        setMessages((prev) => [...prev, message])
      }
    })

    // Clean up on unmount
    return () => {
      disconnectSocket()
    }
  }, [router])

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat || !user) return

    // Clear current messages
    setMessages([])

    try {
      const socket = initializeSocket(user)

      // Request message history from server
      if (activeChat.type === "user") {
        socket.emit("get_private_messages", { userId: activeChat.id }, (response: Message[]) => {
          setMessages(response || [])
        })
      } else {
        socket.emit("get_group_messages", { groupId: activeChat.id }, (response: Message[]) => {
          setMessages(response || [])
        })
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }, [activeChat, user])

  const handleSendMessage = (content: string) => {
    if (!activeChat || !user) return

    try {
      const socket = initializeSocket(user)
      const message: Partial<Message> = {
        content,
        from: user.id,
        timestamp: new Date().toISOString(),
      }

      if (activeChat.type === "user") {
        socket.emit("send_private_message", {
          ...message,
          to: activeChat.id,
        })
      } else {
        socket.emit("send_group_message", {
          ...message,
          to: activeChat.id,
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleCreateGroup = (name: string) => {
    if (!user) return

    try {
      const socket = initializeSocket(user)
      socket.emit("create_group", { name }, (response: Group) => {
        setGroups((prev) => [...prev, response])
      })
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const handleJoinGroup = (groupId: string) => {
    if (!user) return

    try {
      const socket = initializeSocket(user)
      socket.emit("join_group", { groupId })
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const handleLogout = () => {
    disconnectSocket()
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <ChatLayout user={user} onLogout={handleLogout} connectionStatus={isConnected ? "Connected" : "Disconnected"}>
      <div className="flex h-full">
        <div className="w-64 border-r border-black/10 dark:border-white/10 p-4 space-y-6 glass">
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
          <ChatWindow messages={messages} currentUser={user} activeChat={activeChat} users={users} groups={groups} />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </ChatLayout>
  )
}
