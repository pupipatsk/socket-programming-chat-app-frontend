"use client"

import { useMemo } from "react"
import type { User } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserListProps {
  users: User[]
  currentUser: User
  onSelectUser: (userId: string) => void
  activeChat: { type: "private_chat" | "group"; id: string } | null
}

export function UserList({ users, currentUser, onSelectUser, activeChat }: UserListProps) {
  const filteredUsers = useMemo(() => users.filter((user) => user.id !== currentUser.id), [users, currentUser.id])

  const onlineUsers = useMemo(() => filteredUsers.filter((user) => user.status === "online"), [filteredUsers])

  const offlineUsers = useMemo(() => filteredUsers.filter((user) => user.status === "offline"), [filteredUsers])

  const renderUserList = (list: User[], emptyMessage: string) => (
    <ScrollArea className="h-48 rounded-md border border-black/10 bg-white/5">
      <div className="p-2">
        {list.length > 0 ? (
          list.map((user) => (
            <Button
              key={user.id}
              variant="ghost"
              className={`w-full justify-start mb-1 ${
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
        <span className="text-sm text-black/60">({filteredUsers.length})</span>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap gap-1 w-full h-full">
          <TabsTrigger value="online">Online ({onlineUsers.length})</TabsTrigger>
          <TabsTrigger value="offline">Offline ({offlineUsers.length})</TabsTrigger>
          <TabsTrigger value="all">All ({filteredUsers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderUserList(filteredUsers, "No users available")}</TabsContent>
        <TabsContent value="online">{renderUserList(onlineUsers, "No users online")}</TabsContent>
        <TabsContent value="offline">{renderUserList(offlineUsers, "No users offline")}</TabsContent>
      </Tabs>
    </div>
  )
}
