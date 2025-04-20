"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatLayout } from "@/components/chat-layout";
import { ChatWindow } from "@/components/chat-window";
import { UserList } from "@/components/user-list";
import { GroupList } from "@/components/group-list";
import { ChatInput } from "@/components/chat-input";
import { GroupDetails } from "@/components/group-details";
import { useAuth } from "@/contexts/auth-context";
import { ChatProvider, useChat } from "@/contexts/chat-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";
function ChatPageContent() {
  const { user, logout,token } = useAuth();
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
  } = useChat();


  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!token) return;
      try {
        const result = await api.getAllUsers(token);
        setAllUsers(result);
      } catch (err) {
        console.error("Failed to fetch all users:", err);
      }
    };

    fetchAllUsers();
  }, [token]);

  // Responsive state
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmallMobile = useMediaQuery("(max-width: 480px)");
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        showSidebar &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setShowSidebar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, showSidebar]);

  // Reset sidebar visibility when screen size changes
  useEffect(() => {
    setShowSidebar(!isMobile);
  }, [isMobile]);

  const handleViewGroupDetails = async (
    groupId: string,
    showAddMembersSection = false
  ) => {
    try {
      const group = await getGroupById(groupId);
      if (group) {
        setSelectedGroup(group);
        setShowAddMembers(showAddMembersSection);
        setGroupDetailsOpen(true);
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };


  if (!user) return null;
  return (
    <ChatLayout
      user={user}
      onLogout={logout}
      connectionStatus={connectionStatus}
      onToggleSidebar={toggleSidebar}
      isMobile={isMobile}
      showSidebar={showSidebar}
    >
      <div className="flex h-full relative">
        {/* Sidebar */}
        {showSidebar && (
          <div
            ref={sidebarRef}
            className={`${
              isMobile ? "mobile-sidebar" : "border-r border-black/5"
            } responsive-sidebar bg-gradient-sidebar flex flex-col justify-between`}
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-6 mobile-sidebar-content px-4">
                {isMobile && (
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Chats</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebar}
                      className="touch-target"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close sidebar</span>
                    </Button>
                  </div>
                )}

                <UserList
                  users={users}
                  currentUser={user}
                  onSelectUser={(userId) => {
                    setActiveChat({ type: "private_chat", id: userId });
                    if (isMobile) setShowSidebar(false);
                  }}
                  activeChat={activeChat}
                  isMobile={isMobile}
                />

                <GroupList
                  groups={groups}
                  onSelectGroup={(groupId) => {
                    setActiveChat({ type: "group", id: groupId });
                    if (isMobile) setShowSidebar(false);
                  }}
                  onCreateGroup={createGroup}
                  onJoinGroup={joinGroup}
                  onViewGroupDetails={handleViewGroupDetails}
                  currentUserId={user.id}
                  activeChat={activeChat}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isMobile && activeChat && !showSidebar && (
            <div className="p-2 border-b border-black/10 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="flex items-center touch-target"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="ml-2 font-medium truncate">
                {activeChat.type === "group"
                  ? groups.find((g) => g.id === activeChat.id)?.name
                  : users.find((u) => u.id === activeChat.id)?.username}
              </div>
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
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />

          <ChatInput
            onSendMessage={sendMessage}
            disabled={isSending || !activeChat}
            isMobile={isMobile}
          />
        </div>
      </div>

      <GroupDetails
        open={groupDetailsOpen}
        onOpenChange={setGroupDetailsOpen}
        group={selectedGroup}
        currentUser={user}
        allUsers={allUsers}
        onAddMember={addMemberToGroup}
        showAddMembersSection={showAddMembers}
        isMobile={isMobile}
      />
    </ChatLayout>
  );
}

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-light">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}
