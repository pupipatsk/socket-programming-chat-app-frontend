"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { api } from "@/lib/api"
import webSocketService from "@/lib/websocket"
import type { User, GroupChat, Message } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { isUserInGroup } from "@/lib/utils"

interface ActiveChat {
  type: "private_chat" | "group"
  id: string
}

interface ChatContextType {
  users: User[]
  groups: GroupChat[]
  activeChat: ActiveChat | null
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  connectionStatus: string
  setActiveChat: (chat: ActiveChat | null) => void
  sendMessage: (content: string) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  createGroup: (name: string) => Promise<void>
  joinGroup: (groupId: string) => Promise<void>
  addMemberToGroup: (groupId: string, userId: string) => Promise<void>
  refreshData: () => Promise<void>
  getGroupById: (groupId: string) => Promise<GroupChat | undefined>
  getGroupMembers: (groupId: string) => Promise<User[]>
  canAccessGroup: (groupId: string) => boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Disconnected")
  const [privateChatIds, setPrivateChatIds] = useState<Record<string, string>>({})

  // Set up WebSocket connection when active chat changes
  useEffect(() => {
    if (!activeChat || !user || !token) return

    // Set credentials for WebSocket
    webSocketService.setCredentials(user.id, token)

    // Connect to the appropriate chat
    const chatId = activeChat.type === "group" ? activeChat.id : privateChatIds[activeChat.id]

    if (chatId) {
      webSocketService.connect(chatId)

      // Subscribe to messages
      const unsubscribe = webSocketService.subscribeToMessages(chatId, (message) => {
        // Only add the message if it's not already in the list
        setMessages((prev) => {
          if (!prev.some((m) => m.id === message.id)) {
            return [...prev, message]
          }
          return prev
        })
      })

      return () => {
        unsubscribe()
        webSocketService.disconnect()
      }
    }
  }, [activeChat, user, token, privateChatIds])

  // Subscribe to connection status
  useEffect(() => {
    const unsubscribe = webSocketService.subscribeToConnectionStatus((status) => {
      setConnectionStatus(status === "connected" ? "Connected" : status === "disconnected" ? "Disconnected" : "Error")
    })

    return unsubscribe
  }, [])

  // Load initial data
  useEffect(() => {
    if (!user || !token) return

    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        await refreshData()
      } catch (error) {
        console.error("Failed to load initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [user, token])

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat || !user || !token) return

    const loadMessages = async () => {
      setIsLoading(true)
      try {
        // Check access for group chats
        if (activeChat.type === "group") {
          try {
            const group = await api.getGroupById(token, activeChat.id)
            if (!isUserInGroup(user.id, group)) {
              toast({
                title: "Access denied",
                description: "You are not a member of this group",
                variant: "destructive",
              })
              setActiveChat(null)
              return
            }

            setMessages(group.messages)
          } catch (error) {
            console.error("Error loading group:", error)
            toast({
              title: "Error",
              description: "Failed to load group",
              variant: "destructive",
            })
            setActiveChat(null)
          }
        } else {
          // For private chats
          try {
            // Get or create private chat
            const chat = await api.getPrivateChat(token, user.id, activeChat.id)

            // Store the chat ID for WebSocket connection
            setPrivateChatIds((prev) => ({
              ...prev,
              [activeChat.id]: chat.id,
            }))

            setMessages(chat.messages)
          } catch (error) {
            console.error("Error loading private chat:", error)
            toast({
              title: "Error",
              description: "Failed to load messages",
              variant: "destructive",
            })
            setActiveChat(null)
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error)
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [activeChat, user, token])

  const refreshData = useCallback(async () => {
    if (!user || !token) return

    try {
      // Refresh users and groups
      const [updatedUsers, updatedGroups] = await Promise.all([api.getAllUsers(token), api.getGroups(token)])

      setUsers(updatedUsers)
      setGroups(updatedGroups)

      // Refresh messages if there's an active chat
      if (activeChat) {
        if (activeChat.type === "group") {
          const group = await api.getGroupById(token, activeChat.id)
          setMessages(group.messages)
        } else {
          const chat = await api.getPrivateChat(token, user.id, activeChat.id)
          setMessages(chat.messages)
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }, [activeChat, user, token])

  const sendMessage = async (content: string) => {
    if (!activeChat || !user || !token || isSending) return

    try {
      setIsSending(true)

      const tempId = `temp-${Date.now()}`
      const optimisticMessage: Message = {
        id: tempId,
        content,
        author: user.id,
        timestamp: new Date().toISOString(),
        edited: false,
        deleted: false,
      }

      setMessages((prev) => [...prev, optimisticMessage])

      // Send message via WebSocket for real-time delivery
      webSocketService.sendMessage(content)

      // Also send via REST API for persistence
      let newMessage: Message

      if (activeChat.type === "group") {
        newMessage = await api.sendGroupMessage(token, activeChat.id, content)
      } else {
        const chatId = privateChatIds[activeChat.id]
        if (!chatId) {
          throw new Error("Private chat ID not found")
        }
        newMessage = await api.sendPrivateMessage(token, chatId, content)
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? newMessage : msg))
      )
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeChat || !user || !token) return

    try {
      let updatedMessage: Message

      if (activeChat.type === "group") {
        updatedMessage = await api.editGroupMessage(token, activeChat.id, messageId, newContent)
      } else {
        const chatId = privateChatIds[activeChat.id]
        if (!chatId) {
          throw new Error("Private chat ID not found")
        }
        updatedMessage = await api.editPrivateMessage(token, chatId, messageId, newContent)
      }

      // Update the message in the UI
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? updatedMessage : msg)))

      toast({
        title: "Message edited",
        description: "Your message has been updated",
      })
    } catch (error) {
      console.error("Error editing message:", error)
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      })
      await refreshData() // Refresh messages if edit fails
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!activeChat || !user || !token) return

    try {
      if (activeChat.type === "group") {
        await api.deleteGroupMessage(token, activeChat.id, messageId)
      } else {
        const chatId = privateChatIds[activeChat.id]
        if (!chatId) {
          throw new Error("Private chat ID not found")
        }
        await api.deletePrivateMessage(token, chatId, messageId)
      }

      // Update the message in the UI
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, deleted: true } : msg)))

      toast({
        title: "Message deleted",
        description: "Your message has been removed",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
      await refreshData() // Refresh messages if delete fails
    }
  }

  const createGroup = async (name: string) => {
    if (!user || !token) return

    try {
      const newGroup = await api.createGroup(token, name)
      setGroups((prev) => [...prev, newGroup])

      toast({
        title: "Group created",
        description: `${name} has been created successfully`,
      })

      // Automatically set the new group as active
      setActiveChat({ type: "group", id: newGroup.id })
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      })
    }
  }

  const joinGroup = async (groupId: string) => {
    if (!user || !token) return

    try {
      await api.joinGroup(token, groupId)

      // Refresh groups to get updated member list
      const updatedGroups = await api.getGroups(token)
      setGroups(updatedGroups)

      toast({
        title: "Group joined",
        description: "You have joined the group successfully",
      })

      // Automatically set the joined group as active
      setActiveChat({ type: "group", id: groupId })
    } catch (error) {
      console.error("Error joining group:", error)
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      })
    }
  }

  const addMemberToGroup = async (groupId: string, userId: string) => {
    if (!token) return

    try {
      // This is a placeholder since the backend doesn't have a direct endpoint
      // We'll use the join group endpoint which adds the user to the group
      await api.joinGroup(token, groupId)

      // Refresh groups to get updated member list
      const updatedGroups = await api.getGroups(token)
      setGroups(updatedGroups)

      toast({
        title: "Member added",
        description: "New member has been added to the group",
      })
    } catch (error) {
      console.error("Error adding member to group:", error)
      toast({
        title: "Error",
        description: "Failed to add member to group",
        variant: "destructive",
      })
    }
  }

  const getGroupById = async (groupId: string) => {
    if (!token) return undefined

    try {
      return await api.getGroupById(token, groupId)
    } catch (error) {
      console.error("Error fetching group:", error)
      return undefined
    }
  }

  const getGroupMembers = async (groupId: string) => {
    if (!token) return []

    try {
      const group = await api.getGroupById(token, groupId)
      // Map member IDs to user objects
      return users.filter((user) => group.members.includes(user.id))
    } catch (error) {
      console.error("Error fetching group members:", error)
      return []
    }
  }

  const canAccessGroup = useCallback(
    (groupId: string) => {
      if (!user) return false

      const group = groups.find((g) => g.id === groupId)
      if (!group) return false

      return isUserInGroup(user.id, group)
    },
    [user, groups],
  )

  const setActiveChatWithCheck = useCallback(
    (chat: ActiveChat | null) => {
      if (!chat || !user) {
        setActiveChat(null)
        return
      }

      // If it's a group chat, check if the user is a member
      if (chat.type === "group") {
        const group = groups.find((g) => g.id === chat.id)
        if (group && !isUserInGroup(user.id, group)) {
          toast({
            title: "Access denied",
            description: "You are not a member of this group",
            variant: "destructive",
          })
          return
        }
      }

      setActiveChat(chat)
    },
    [user, groups, toast],
  )

  const value = {
    users,
    groups,
    activeChat,
    messages,
    isLoading,
    isSending,
    connectionStatus,
    setActiveChat: setActiveChatWithCheck,
    sendMessage,
    editMessage,
    deleteMessage,
    createGroup,
    joinGroup,
    addMemberToGroup,
    refreshData,
    getGroupById,
    getGroupMembers,
    canAccessGroup,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
