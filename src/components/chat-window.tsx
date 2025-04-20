"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Message, User, GroupChat } from "@/types";
import {
  formatTime,
  formatDate,
  getUserName,
  groupMessagesByDate,
} from "@/lib/utils";
import webSocketService from "@/lib/websocket";

interface ChatWindowProps {
  messages: Message[];
  currentUser: User;
  activeChat: { type: "private_chat" | "group"; id: string } | null;
  users: User[];
  groups: GroupChat[];
  isLoading: boolean;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isMobile?: boolean;
  isSmallMobile?: boolean;
}

export function deduplicateMessages(messages: Message[]): Message[] {
  const seen = new Set<string>();
  const result: Message[] = [];

  for (const msg of messages) {
    const key = `${msg.author}-${msg.content.trim()}-${new Date(msg.timestamp)
      .toISOString()
      .slice(0, 19)}`; // to seconds
    if (!seen.has(key)) {
      seen.add(key);
      result.push(msg);
    }
  }

  return result;
}

export function ChatWindow({
  messages,
  currentUser,
  activeChat,
  users,
  groups,
  isLoading,
  onEditMessage,
  onDeleteMessage,
  isMobile = false,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollAreaRef.current) return;
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (!scrollElement) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    };

    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [scrollAreaRef.current]);

  useEffect(() => {
    if (
      messages.length > prevMessagesLength &&
      autoScroll &&
      scrollRef.current
    ) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
    setPrevMessagesLength(messages.length);
  }, [messages, prevMessagesLength, autoScroll]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: "auto" });
      });
    }
  }, [activeChat, messages.length]);

  const getActiveChatName = () => {
    if (!activeChat) return "Select a chat";
    if (activeChat.type === "private_chat") {
      const user = users.find((u) => u.id === activeChat.id);
      return user ? user.username : "Unknown user";
    } else {
      const group = groups.find((g) => g.id === activeChat.id);
      return group ? group.name : "Unknown group";
    }
  };

  function tryExtractContent(content: string): string {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed.content) {
        return parsed.content;
      }
    } catch {
      // not a JSON string, return as-is
    }
    return content;
  }

  const handleStartEdit = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (editingMessage && editContent.trim()) {
      onEditMessage(editingMessage, editContent.trim());
      setEditingMessage(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const uniqueMessages = deduplicateMessages(messages);
  const messagesByDate = groupMessagesByDate(uniqueMessages);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!activeChat) return;

    const handleTyping = (msg: string) => {
      const parts = msg.split(":");
      const [, chatId, username] = parts;

      if (chatId === activeChat?.id && username !== currentUser.username) {
        setTypingUsers((prev) =>
          prev.includes(username) ? prev : [...prev, username]
        );

        if (typingTimeouts.current[username]) {
          clearTimeout(typingTimeouts.current[username]);
        }

        typingTimeouts.current[username] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
          delete typingTimeouts.current[username];
        }, 1500);
      }
    };

    const handleStopTyping = (msg: string) => {
      const parts = msg.split(":");
      const [, chatId, username] = parts;
      if (chatId === activeChat?.id && username !== currentUser.username) {
        setTypingUsers((prev) => prev.filter((u) => u !== username));
        if (typingTimeouts.current[username]) {
          clearTimeout(typingTimeouts.current[username]);
          delete typingTimeouts.current[username];
        }
      }
    };
    const unsubscribe = webSocketService.subscribeToMessages(
      activeChat.id,
      (message: Message) => {
        if (message.content.startsWith("TYPING:"))
          handleTyping(message.content);
        if (message.content.startsWith("STOP_TYPING:"))
          handleStopTyping(message.content);
      }
    );

    return () => {
      unsubscribe();
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
      setTypingUsers([]);
    };
  }, [activeChat]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-lg text-black/40">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {!isMobile && (
        <div className="sticky top-0 z-10 p-3 md:p-4 border-b border-black/10 bg-white/70 backdrop-blur-md">
          <h2 className="text-lg font-semibold">{getActiveChatName()}</h2>
        </div>
      )}

      <div className="flex-3 overflow-hidden relative">
        <ScrollArea
          className="h-full p-1 overflow-y-auto max-h-[calc(100vh-200px)]"
          scrollHideDelay={300}
          type="always"
          ref={scrollAreaRef as any}
        >
          <div className="p-3 md:p-2 pb-6 min-h-full">
            {activeChat ? (
              messages.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(messagesByDate).map(
                    ([date, dateMessages]) => {
                      const seenIds = new Set<string>();
                      const uniqueMessages = dateMessages.filter((msg) => {
                        if (seenIds.has(msg.id)) return false;
                        seenIds.add(msg.id);
                        return true;
                      });

                      return (
                        <div key={date} className="space-y-2">
                          <div className="text-center text-xs text-black/40 my-2">
                            {formatDate(uniqueMessages[0].timestamp)}
                          </div>

                          {uniqueMessages.map((message) => {
                            if (
                              message.content.startsWith("TYPING:") ||
                              message.content.startsWith("STOP_TYPING:")
                            ) {
                              return null;
                            }
                            const isCurrentUser =
                              message.author === currentUser.id;
                            const isDeleted = message.deleted;
                            const canModify = isCurrentUser && !isDeleted;

                            return (
                              <div
                                key={message.id}
                                className={`flex ${
                                  isCurrentUser
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] sm:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm backdrop-blur-md ${
                                    isCurrentUser
                                      ? "bg-black/80 text-white rounded-br-none"
                                      : "bg-gray-200/30 text-black border border-white/20 rounded-bl-none"
                                  }`}
                                >
                                  {!isCurrentUser &&
                                    activeChat.type === "group" && (
                                      <div className="text-xs font-semibold mb-1">
                                        {getUserName(
                                          message.author,
                                          currentUser,
                                          users
                                        )}
                                      </div>
                                    )}

                                  {editingMessage === message.id ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editContent}
                                        onChange={(e) =>
                                          setEditContent(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        className={`min-h-[60px] text-sm ${
                                          isCurrentUser
                                            ? "text-white bg-black/50"
                                            : ""
                                        }`}
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          onClick={handleCancelEdit}
                                          className="h-8 w-15 px-2 text-xs"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="default"
                                          onClick={handleSaveEdit}
                                          className="h-8 w-15 px-2 text-xs"
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className={`${
                                        isDeleted
                                          ? "italic text-opacity-80"
                                          : ""
                                      } text-sm md:text-base break-words`}
                                    >
                                      {isDeleted
                                        ? "(Message deleted)"
                                        : typeof message.content === "string"
                                        ? tryExtractContent(message.content)
                                        : message.content}
                                    </div>
                                  )}

                                  <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end">
                                    {formatTime(message.timestamp)}
                                    {message.edited && !message.deleted && (
                                      <span className="ml-1">(edited)</span>
                                    )}

                                    {canModify && !editingMessage && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 ml-1 touch-target"
                                          >
                                            <MoreHorizontal className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleStartEdit(message)
                                            }
                                          >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              onDeleteMessage(message.id)
                                            }
                                          >
                                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                  )}
                  {typingUsers.length > 0 && (
                    <div className="px-4 py-1 text-sm italic text-black/50">
                      {typingUsers.join(", ")} is typing...
                    </div>
                  )}
                  <div ref={scrollRef} className="h-1" />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-black/40">
                  No messages yet. Start the conversation!
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-black/40">
                Select a user or group to start chatting
              </div>
            )}
          </div>
        </ScrollArea>

        {!autoScroll && messages.length > 5 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 rounded-full shadow-md opacity-80 hover:opacity-100 z-10"
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "smooth" });
                setAutoScroll(true);
              }
            }}
          >
            ↓
          </Button>
        )}
      </div>
    </div>
  );
}
