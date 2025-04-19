"use client"

import type React from "react"
import { useState } from "react"
import type { GroupChat } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus, UserPlus, Info } from "lucide-react"
import { isUserInGroup } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface GroupListProps {
  groups: GroupChat[]
  onSelectGroup: (groupId: string) => void
  onCreateGroup: (name: string) => void
  onJoinGroup: (groupId: string) => void
  onViewGroupDetails: (groupId: string, showAddMembers?: boolean) => void
  currentUserId: string
  activeChat: { type: "private_chat" | "group"; id: string } | null
  isMobile?: boolean
}

export function GroupList({
  groups,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  onViewGroupDetails,
  currentUserId,
  activeChat,
  isMobile = false,
}: GroupListProps) {
  const [newGroupName, setNewGroupName] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [selectedGroupForJoin, setSelectedGroupForJoin] = useState<GroupChat | null>(null)
  const { toast } = useToast()

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim())
      setNewGroupName("")
      setCreateDialogOpen(false)
    }
  }

  const handleJoinButtonClick = (group: GroupChat) => {
    // Check if user is already a member
    if (isUserInGroup(currentUserId, group)) {
      toast({
        title: "Already a member",
        description: `You are already a member of ${group.name}`,
        duration: 3000,
      })
    } else {
      // Show join dialog
      setSelectedGroupForJoin(group)
      setJoinDialogOpen(true)
    }
  }

  const handleConfirmJoin = () => {
    if (selectedGroupForJoin) {
      onJoinGroup(selectedGroupForJoin.id)
      setJoinDialogOpen(false)
      setSelectedGroupForJoin(null)
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
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5 touch-target">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Create Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent className={isMobile ? "w-[95%] max-w-md" : ""}>
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

      <ScrollArea className="responsive-scroll rounded-md border border-black/10 bg-white/5">
        <div className="p-2">
          {groups.length > 0 ? (
            groups.map((group) => {
              const isUserMember = isUserInGroup(currentUserId, group)

              return (
                <div
                  key={group.id}
                  className={`
                    grid grid-cols-[1fr_auto_auto] items-center gap-0 px-2 py-1 mb-1 rounded transition cursor-pointer
                    ${activeChat?.type === "group" && activeChat.id === group.id ? "bg-black/10" : "hover:bg-black/5"}
                  `}
                  onClick={() => {
                    if (isUserMember) {
                      onSelectGroup(group.id)
                    } else {
                      toast({
                        title: "Access denied",
                        description: `You are not a member of ${group.name}. Join the group to view messages.`,
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  {/* Group name and count */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm font-medium">{group.name}</span>
                    <span className="text-xs text-black/60 whitespace-nowrap">({group.members?.length || 0})</span>
                  </div>

                  {/* Join icon */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 hover:bg-black/5 flex items-center justify-center touch-target"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJoinButtonClick(group)
                    }}
                    title={isUserInGroup(currentUserId, group) ? "Already a member" : "Join Group"}
                  >
                    <UserPlus className={`h-4 w-4 ${isUserInGroup(currentUserId, group) ? "text-green-500" : ""}`} />
                  </Button>

                  {/* Info icon */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 hover:bg-black/5 flex items-center justify-center touch-target"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewGroupDetails(group.id)
                    }}
                    title="Group Details"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              )
            })
          ) : (
            <div className="text-center py-4 text-black/40">No groups available</div>
          )}
        </div>
      </ScrollArea>

      {/* Join Group Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className={isMobile ? "w-[95%] max-w-md" : "sm:max-w-[425px]"}>
          <DialogHeader>
            <DialogTitle>Join Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to join <span className="font-semibold">{selectedGroupForJoin?.name}</span>?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmJoin}>Join Group</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
