"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChatLayout } from "@/components/chat-layout"
import { ChatWindow } from "@/components/chat-window"
import { UserList } from "@/components/user-list"
import { GroupList } from "@/components/group-list"
import { ChatInput } from "@/components/chat-input"
import { GroupDetails } from "@/components/group-details"
import { useAuth } from "@/contexts/auth-context"
import { ChatProvider, useChat } from "@/contexts/chat-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"

function ChatPageContent() {
  const { user, logout } = useAuth()
  const {
    users,
    groups,
    activeChat,
    messages,
    isLoading,
    isSending,
    connectionStatus,
    setActiveChat,
    sendMessage,
    editMessage,
    deleteMessage,
    createGroup,
    joinGroup,
    addMemberToGroup,
    getGroupById,
    getGroupMembers,
  } = useChat()

  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [showAddMembers, setShowAddMembers] = useState(false)

  // Responsive state
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    if (!isMobile) {
      setShowSidebar(true)
    }
  }, [isMobile])

  const handleViewGroupDetails = async (groupId: string, showAddMembersSection = false) => {
    try {
      const group = await getGroupById(groupId)
      if (group) {
        setSelectedGroup(group)
        setShowAddMembers(showAddMembersSection)
        setGroupDetailsOpen(true)
      }
    } catch (error) {
      console.error("Error fetching group details:", error)
    }
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  if (!user) return null

  return (
    <ChatLayout user={user} onLogout={logout} connectionStatus={connectionStatus}>
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
            onSelectUser={(userId) => {
              setActiveChat({ type: "private_chat", id: userId })
              if (isMobile) setShowSidebar(false)
            }}
            activeChat={activeChat}
          />
          <GroupList
            groups={groups}
            onSelectGroup={(groupId) => {
              setActiveChat({ type: "group", id: groupId })
              if (isMobile) setShowSidebar(false)
            }}
            onCreateGroup={createGroup}
            onJoinGroup={joinGroup}
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
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
          />
          <ChatInput onSendMessage={sendMessage} disabled={isSending || !activeChat} />
        </div>
      </div>

      <GroupDetails
        open={groupDetailsOpen}
        onOpenChange={setGroupDetailsOpen}
        group={selectedGroup}
        currentUser={user}
        allUsers={users}
        onAddMember={addMemberToGroup}
        showAddMembersSection={showAddMembers}
      />
    </ChatLayout>
  )
}

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-light">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  )
}
