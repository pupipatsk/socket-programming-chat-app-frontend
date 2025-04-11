"use client"

import type { User } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

interface UserListProps {
  users: User[]
  currentUser: User
  onSelectUser: (userId: string) => void
  activeChat: { type: "user" | "group"; id: string } | null
}

export function UserList({ users, currentUser, onSelectUser, activeChat }: UserListProps) {
  // Filter out current user from the list
  const filteredUsers = users.filter((user) => user.id !== currentUser.id)

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-black/60 dark:text-white/60" />
        <h2 className="text-lg font-semibold">Users</h2>
        <div className="text-sm text-black/60 dark:text-white/60">({filteredUsers.length})</div>
      </div>

      <ScrollArea className="h-48 rounded-md border border-black/10 dark:border-white/10 bg-white/5 dark:bg-black/5">
        <div className="p-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className={`w-full justify-start mb-1 ${
                  activeChat?.type === "user" && activeChat.id === user.id ? "bg-black/10 dark:bg-white/10" : ""
                } hover:bg-black/5 dark:hover:bg-white/5`}
                onClick={() => onSelectUser(user.id)}
              >
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                  <span className="truncate">{user.username}</span>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-center py-4 text-black/40 dark:text-white/40">No users online</div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
