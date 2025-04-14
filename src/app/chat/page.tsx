// src/app/chat/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatLayout } from "@/components/chat-layout"
import { ChatWindow } from "@/components/chat-window"
import { UserList } from "@/components/user-list"
import { GroupList } from "@/components/group-list"
import { ChatInput } from "@/components/chat-input"
import { GroupDetails } from "@/components/group-details"
import { mockApi } from "@/lib/mock-api"
import type { User, GroupChat, Message } from "@/types"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [activeChat, setActiveChat] = useState<{ type: "private_chat" | "group"; id: string } | null>(null)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus] = useState("Connected")
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Responsive state
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    if (!isMobile) {
      setShowSidebar(true)
    }
  }, [isMobile])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)

    const loadInitialData = async () => {
      try {
        const [allUsers, allGroups] = await Promise.all([mockApi.getAllUsers(), mockApi.getGroups()])
        setUsers(allUsers)
        setGroups(allGroups)
      } catch (error) {
        console.error("Failed to load initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()

    // Set up polling to simulate real-time updates
    const pollInterval = setInterval(async () => {
      if (activeChat) {
        await refreshMessages()
      }

      // Refresh users and groups periodically
      try {
        const [updatedUsers, updatedGroups] = await Promise.all([mockApi.getAllUsers(), mockApi.getGroups()])
        setUsers(updatedUsers)
        setGroups(updatedGroups)
      } catch (error) {
        console.error("Error refreshing data:", error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [router])

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat || !user) return

    const loadMessages = async () => {
      setIsLoading(true)
      try {
        const chatMessages =
          activeChat.type === "private_chat"
            ? await mockApi.getPrivateMessages(user.id, activeChat.id)
            : await mockApi.getGroupMessages(activeChat.id)

        setMessages(chatMessages)
        setActiveChatId(
          activeChat.type === "private_chat" ? `private_${user.id}_${activeChat.id}` : `group_${activeChat.id}`,
        )

        // On mobile, hide sidebar when a chat is selected
        if (isMobile) {
          setShowSidebar(false)
        }
      } catch (error) {
        console.error("Error loading messages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [activeChat, user, isMobile])

  const refreshMessages = async () => {
    if (!activeChat || !user) return

    try {
      const chatMessages =
        activeChat.type === "private_chat"
          ? await mockApi.getPrivateMessages(user.id, activeChat.id)
          : await mockApi.getGroupMessages(activeChat.id)

      setMessages(chatMessages)
    } catch (error) {
      console.error("Error refreshing messages:", error)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!activeChat || !user || isSending) return

    try {
      setIsSending(true)
      const newMessage =
        activeChat.type === "private_chat"
          ? await mockApi.sendPrivateMessage(user.id, activeChat.id, content)
          : await mockApi.sendGroupMessage(activeChat.id, user.id, content)

      // Update messages optimistically without duplicating
      setMessages((prev) => {
        // Check if message already exists to prevent duplication
        if (!prev.some((msg) => msg.id === newMessage.id)) {
          return [...prev, newMessage]
        }
        return prev
      })
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeChat || !user || !activeChatId) return

    try {
      await mockApi.editMessage(
        activeChat.type === "private_chat" ? "private" : "group",
        activeChat.type === "private_chat" ? (await mockApi.getPrivateChat(user.id, activeChat.id)).id : activeChat.id,
        messageId,
        newContent,
      )

      // Update the message in the UI optimistically
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content: newContent, edited: true } : msg)),
      )
    } catch (error) {
      console.error("Error editing message:", error)
      await refreshMessages() // Refresh messages if edit fails
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChat || !user || !activeChatId) return

    try {
      await mockApi.deleteMessage(
        activeChat.type === "private_chat" ? "private" : "group",
        activeChat.type === "private_chat" ? (await mockApi.getPrivateChat(user.id, activeChat.id)).id : activeChat.id,
        messageId,
      )

      // Update the message in the UI optimistically
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, deleted: true } : msg)))
    } catch (error) {
      console.error("Error deleting message:", error)
      await refreshMessages() // Refresh messages if delete fails
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
      const updatedGroups = await mockApi.getGroups()
      setGroups(updatedGroups)
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const handleViewGroupDetails = async (groupId: string) => {
    try {
      const group = await mockApi.getGroupById(groupId)
      setSelectedGroup(group)
      setGroupDetailsOpen(true)
    } catch (error) {
      console.error("Error fetching group details:", error)
    }
  }

  const handleAddMemberToGroup = async (groupId: string, userId: string) => {
    try {
      await mockApi.addMemberToGroup(groupId, userId)

      // Refresh the group details
      const updatedGroup = await mockApi.getGroupById(groupId)
      setSelectedGroup(updatedGroup)

      // Refresh all groups
      const updatedGroups = await mockApi.getGroups()
      setGroups(updatedGroups)
    } catch (error) {
      console.error("Error adding member to group:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-light">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <ChatLayout user={user} onLogout={handleLogout} connectionStatus={connectionStatus}>
      <div className="flex h-full relative">
        {/* Sidebar */}
        <div
          className={`${showSidebar ? "block" : "hidden"} ${
            isMobile ? "absolute z-10 w-full md:w-64 h-full" : "w-64"
          } border-r border-black/5 p-4 space-y-6 glass`}
        >
          <UserList
            users={users}
            currentUser={user}
            onSelectUser={(userId) => setActiveChat({ type: "private_chat", id: userId })}
            activeChat={activeChat}
          />
          <GroupList
            groups={groups}
            onSelectGroup={(groupId) => setActiveChat({ type: "group", id: groupId })}
            onCreateGroup={handleCreateGroup}
            onJoinGroup={handleJoinGroup}
            onViewGroupDetails={handleViewGroupDetails}
            currentUserId={user.id}
            activeChat={activeChat}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {isMobile && activeChat && !showSidebar && (
            <div className="p-2 border-b border-black/10">
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          )}

          <ChatWindow
            messages={messages}
            currentUser={user}
            activeChat={activeChat}
            users={users}
            groups={groups}
            isLoading={isLoading}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />
          <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
        </div>
      </div>

      <GroupDetails
        open={groupDetailsOpen}
        onOpenChange={setGroupDetailsOpen}
        group={selectedGroup}
        currentUser={user}
        allUsers={users}
        onAddMember={handleAddMemberToGroup}
      />

      <Toaster />
    </ChatLayout>
  )
}
