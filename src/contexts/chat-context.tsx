"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { mockApi } from "@/lib/mock-api"
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
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    if (!user) return

    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        const [allUsers, allGroups] = await Promise.all([mockApi.getAllUsers(), mockApi.getGroups()])
        setUsers(allUsers)
        setGroups(allGroups)
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

    // Set up polling to simulate real-time updates
    const pollInterval = setInterval(refreshData, 5000)
    return () => clearInterval(pollInterval)
  }, [user])

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat || !user) return

    const loadMessages = async () => {
      setIsLoading(true)
      try {
        // Check access for group chats
        if (activeChat.type === "group") {
          const group = await mockApi.getGroupById(activeChat.id)
          if (!isUserInGroup(user.id, group)) {
            toast({
              title: "Access denied",
              description: "You are not a member of this group",
              variant: "destructive",
            })
            setActiveChat(null)
            return
          }
        }

        const chatMessages =
          activeChat.type === "private_chat"
            ? await mockApi.getPrivateMessages(user.id, activeChat.id)
            : await mockApi.getGroupMessages(activeChat.id)

        setMessages(chatMessages)
        setActiveChatId(
          activeChat.type === "private_chat" ? `private_${user.id}_${activeChat.id}` : `group_${activeChat.id}`,
        )
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
  }, [activeChat, user])

  const refreshData = useCallback(async () => {
    if (!user) return

    try {
      // Refresh messages if there's an active chat
      if (activeChat) {
        const chatMessages =
          activeChat.type === "private_chat"
            ? await mockApi.getPrivateMessages(user.id, activeChat.id)
            : await mockApi.getGroupMessages(activeChat.id)

        setMessages(chatMessages)
      }

      // Refresh users and groups
      const [updatedUsers, updatedGroups] = await Promise.all([mockApi.getAllUsers(), mockApi.getGroups()])
      setUsers(updatedUsers)
      setGroups(updatedGroups)
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }, [activeChat, user])

  const sendMessage = async (content: string) => {
    if (!activeChat || !user || isSending) return

    try {
      setIsSending(true)
      const newMessage =
        activeChat.type === "private_chat"
          ? await mockApi.sendPrivateMessage(user.id, activeChat.id, content)
          : await mockApi.sendGroupMessage(activeChat.id, user.id, content)

      // Update messages optimistically
      setMessages((prev) => {
        if (!prev.some((msg) => msg.id === newMessage.id)) {
          return [...prev, newMessage]
        }
        return prev
      })
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
    if (!activeChat || !user || !activeChatId) return

    try {
      await mockApi.deleteMessage(
        activeChat.type === "private_chat" ? "private" : "group",
        activeChat.type === "private_chat" ? (await mockApi.getPrivateChat(user.id, activeChat.id)).id : activeChat.id,
        messageId,
      )

      // Update the message in the UI optimistically
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
    if (!user) return

    try {
      const newGroup = await mockApi.createGroup(name, user.id)
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
    if (!user) return

    try {
      await mockApi.joinGroup(groupId, user.id)

      // Refresh groups to get updated member list
      const updatedGroups = await mockApi.getGroups()
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
    try {
      await mockApi.addMemberToGroup(groupId, userId)

      // Refresh groups to get updated member list
      const updatedGroups = await mockApi.getGroups()
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
    try {
      return await mockApi.getGroupById(groupId)
    } catch (error) {
      console.error("Error fetching group:", error)
      return undefined
    }
  }

  const getGroupMembers = async (groupId: string) => {
    try {
      return await mockApi.getGroupMembers(groupId)
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
