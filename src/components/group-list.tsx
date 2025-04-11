"use client"

import type React from "react"

import { useState } from "react"
import type { Group } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus, UserPlus } from "lucide-react"

interface GroupListProps {
  groups: Group[]
  onSelectGroup: (groupId: string) => void
  onCreateGroup: (name: string) => void
  onJoinGroup: (groupId: string) => void
  activeChat: { type: "user" | "group"; id: string } | null
}

export function GroupList({ groups, onSelectGroup, onCreateGroup, onJoinGroup, activeChat }: GroupListProps) {
  const [newGroupName, setNewGroupName] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim())
      setNewGroupName("")
      setCreateDialogOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-black/60" />
          <h2 className="text-lg font-semibold">Groups</h2>
          <div className="text-sm text-black/60">({groups.length})</div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Create Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <Input
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="glass-input"
              />
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90">
                Create Group
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-48 rounded-md border border-black/10 bg-white/5">
        <div className="p-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="flex items-center mb-1">
                <Button
                  variant="ghost"
                  className={`flex-1 justify-start ${
                    activeChat?.type === "group" && activeChat.id === group.id ? "bg-black/10" : ""
                  } hover:bg-black/5`}
                  onClick={() => onSelectGroup(group.id)}
                >
                  <span className="truncate">{group.name}</span>
                  <span className="ml-2 text-xs text-black/60">({group.members?.length || 0})</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-black/5"
                  onClick={() => onJoinGroup(group.id)}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="sr-only">Join Group</span>
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-black/40">No groups available</div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
