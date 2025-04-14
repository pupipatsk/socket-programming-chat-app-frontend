// src/components/user-list.tsx
"use client";

import type { User } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

interface UserListProps {
  users: User[];
  currentUser: User;
  onSelectUser: (userId: string) => void;
  activeChat: { type: "private_chat" | "group"; id: string } | null;
}

export function UserList({
  users,
  currentUser,
  onSelectUser,
  activeChat,
}: UserListProps) {
  // Filter out current user from the list
  const filteredUsers = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [users, currentUser.id]
  );

  const onlineUsers = useMemo(
    () => filteredUsers.filter((user) => user.status === "online"),
    [filteredUsers]
  );

  const offlineUsers = useMemo(
    () => filteredUsers.filter((user) => user.status === "offline"),
    [filteredUsers]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-black/60" />
        <h2 className="text-lg font-semibold">Users</h2>
        <div className="text-sm text-black/60">({filteredUsers.length})</div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="online">
            Online ({onlineUsers.length})
          </TabsTrigger>
          <TabsTrigger value="offline">
            Offline ({offlineUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ScrollArea className="h-48 rounded-md border border-black/10 bg-white/5">
            <div className="p-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className={`w-full justify-start mb-1 ${
                      activeChat?.type === "private_chat" &&
                      activeChat.id === user.id
                        ? "bg-black/10"
                        : ""
                    } hover:bg-black/5`}
                    onClick={() => onSelectUser(user.id)}
                  >
                    <div className="flex items-center">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          user.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        } mr-2`}
                      />
                      <span className="truncate">{user.username}</span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-black/40">
                  No users available
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="online">
          <ScrollArea className="h-48 rounded-md border border-black/10 bg-white/5">
            <div className="p-2">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className={`w-full justify-start mb-1 ${
                      activeChat?.type === "private_chat" &&
                      activeChat.id === user.id
                        ? "bg-black/10"
                        : ""
                    } hover:bg-black/5`}
                    onClick={() => onSelectUser(user.id)}
                  >
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      <span className="truncate">{user.username}</span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-black/40">
                  No users online
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="offline">
          <ScrollArea className="h-48 rounded-md border border-black/10 bg-white/5">
            <div className="p-2">
              {offlineUsers.length > 0 ? (
                offlineUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className={`w-full justify-start mb-1 ${
                      activeChat?.type === "private_chat" &&
                      activeChat.id === user.id
                        ? "bg-black/10"
                        : ""
                    } hover:bg-black/5`}
                    onClick={() => onSelectUser(user.id)}
                  >
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                      <span className="truncate">{user.username}</span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-black/40">
                  No users offline
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
