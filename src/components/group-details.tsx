"use client"

import { useState, useEffect } from "react"
import type { User, GroupChat } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockApi } from "@/lib/mock-api"
import { UserPlus, Search } from "lucide-react"

interface GroupDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupChat | null
  currentUser: User
  allUsers: User[]
  onAddMember: (groupId: string, userId: string) => void
  showAddMembersSection?: boolean
}

export function GroupDetails({
  open,
  onOpenChange,
  group,
  currentUser,
  allUsers,
  onAddMember,
  showAddMembersSection = false,
}: GroupDetailsProps) {
  const [members, setMembers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreator, setIsCreator] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)

  useEffect(() => {
    if (group && open) {
      const fetchMembers = async () => {
        try {
          const groupMembers = await mockApi.getGroupMembers(group.id)
          setMembers(groupMembers)
          setIsCreator(group.creator === currentUser.id)

          // Automatically open the add member dialog if showAddMembersSection is true
          if (showAddMembersSection && group.creator === currentUser.id) {
            setAddMemberDialogOpen(true)
          }
        } catch (error) {
          console.error("Failed to fetch group members:", error)
        }
      }

      fetchMembers()
    }
  }, [group, open, currentUser.id, showAddMembersSection])

  if (!group) return null

  const onlineMembers = members.filter((member) => member.status === "online")
  const offlineMembers = members.filter((member) => member.status === "offline")

  const filteredUsers = allUsers.filter(
    (user) =>
      !members.some((member) => member.id === user.id) &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{group.name} - Group Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Members ({members.length})</h3>
            {isCreator && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddMemberDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Add Members
              </Button>
            )}
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({members.length})</TabsTrigger>
              <TabsTrigger value="online">Online ({onlineMembers.length})</TabsTrigger>
              <TabsTrigger value="offline">Offline ({offlineMembers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-60 rounded-md border border-black/10 bg-white/5">
                <div className="p-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 px-2 border-b border-black/5 last:border-0"
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            member.status === "online" ? "bg-green-500" : "bg-gray-400"
                          } mr-2`}
                        />
                        <span>{member.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.id === group.creator && (
                          <span className="text-xs bg-black/10 px-2 py-1 rounded">Creator</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="online">
              <ScrollArea className="h-60 rounded-md border border-black/10 bg-white/5">
                <div className="p-2">
                  {onlineMembers.length > 0 ? (
                    onlineMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-2 px-2 border-b border-black/5 last:border-0"
                      >
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                          <span>{member.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.id === group.creator && (
                            <span className="text-xs bg-black/10 px-2 py-1 rounded">Creator</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-black/40">No online members</div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="offline">
              <ScrollArea className="h-60 rounded-md border border-black/10 bg-white/5">
                <div className="p-2">
                  {offlineMembers.length > 0 ? (
                    offlineMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-2 px-2 border-b border-black/5 last:border-0"
                      >
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                          <span>{member.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.id === group.creator && (
                            <span className="text-xs bg-black/10 px-2 py-1 rounded">Creator</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-black/40">No offline members</div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Members to {group.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 glass-input"
                />
              </div>

              <ScrollArea className="h-60 rounded-md border border-black/10 bg-white/5">
                <div className="p-2">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between py-2 px-2 border-b border-black/5 last:border-0"
                      >
                        <div className="flex items-center">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              user.status === "online" ? "bg-green-500" : "bg-gray-400"
                            } mr-2`}
                          />
                          <span>{user.username}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onAddMember(group.id, user.id)
                            setSearchTerm("")
                          }}
                          className="h-8 hover:bg-black/5"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-black/40">
                      {searchTerm ? "No users found" : "All users are already members"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
