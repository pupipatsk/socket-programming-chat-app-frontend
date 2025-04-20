"use client"

import { useEffect, useState, useCallback } from "react"
import type { User } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface UserListProps {
  users: User[] // still needed for compatibility
  currentUser: User
  onSelectUser: (userId: string) => void
  activeChat: { type: "private_chat" | "group"; id: string } | null
  isMobile?: boolean
}

export function UserList({ currentUser, onSelectUser, activeChat, isMobile = false }: UserListProps) {
  const { token } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [offlineUsers, setOfflineUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])

  const loadUsers = useCallback(async () => {
    if (!token) return
    try {
      const [online, offline] = await Promise.all([
        api.getActiveUsers(token),
        api.getInactiveUsers(token),
      ])
      const filteredOnline = online.filter((u) => u.id !== currentUser.id)
      const filteredOffline = offline.filter((u) => u.id !== currentUser.id)

      setOnlineUsers(filteredOnline)
      setOfflineUsers(filteredOffline)
      setAllUsers([...filteredOnline, ...filteredOffline])
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }, [token, currentUser.id])

  useEffect(() => {
    loadUsers()
    const interval = setInterval(loadUsers, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [loadUsers])

  const renderUserList = (list: User[], emptyMessage: string) => (
    <ScrollArea className="responsive-scroll rounded-md border border-black/10 bg-white/5">
      <div className="p-2">
        {list.length > 0 ? (
          list.map((user) => (
            <Button
              key={user.id}
              variant="ghost"
              className={`w-full justify-start mb-1 min-h-[44px] ${
                activeChat?.type === "private_chat" && activeChat.id === user.id ? "bg-black/10" : ""
              } hover:bg-black/5`}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="flex items-center">
                <div
                  className={`h-2 w-2 rounded-full mr-2 ${user.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                />
                <span className="truncate">{user.username}</span>
              </div>
            </Button>
          ))
        ) : (
          <div className="text-center py-4 text-black/40">{emptyMessage}</div>
        )}
      </div>
    </ScrollArea>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-black/60" />
        <h2 className="text-lg font-semibold">Users</h2>
        <span className="text-sm text-black/60">({allUsers.length})</span>
      </div>

      <Tabs defaultValue="online" className="w-full">
        <TabsList className="flex flex-wrap gap-1 w-full h-full">
          <TabsTrigger value="all" className="flex-1 min-h-[36px]">
            All ({allUsers.length})
          </TabsTrigger>
          <TabsTrigger value="online" className="flex-1 min-h-[36px]">
            Online ({onlineUsers.length})
          </TabsTrigger>
          <TabsTrigger value="offline" className="flex-1 min-h-[36px]">
            Offline ({offlineUsers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderUserList(allUsers, "No users available")}</TabsContent>
        <TabsContent value="online">{renderUserList(onlineUsers, "No users online")}</TabsContent>
        <TabsContent value="offline">{renderUserList(offlineUsers, "No users offline")}</TabsContent>
      </Tabs>
    </div>
  )
}