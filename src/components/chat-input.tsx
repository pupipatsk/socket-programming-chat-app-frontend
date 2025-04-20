"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import webSocketService from "@/lib/websocket";
import { useChat } from "@/contexts/chat-context";
import { useAuth } from "@/contexts/auth-context";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  isMobile?: boolean;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  isMobile = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeChat } = useChat();
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [message]);

  const notifyTyping = () => {
    if (!activeChat || !user) return;
    webSocketService.sendTyping(activeChat.id, user.username);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      webSocketService.sendStopTyping(activeChat.id, user.username);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else {
      notifyTyping();
    }
  };

  return (
    <div
      className={`p-3 md:p-4 border-t border-black/10 bg-white/5 safe-bottom ${
        isMobile ? "pb-6" : ""
      }`}
    >
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="resize-none glass-input bg-white/50 min-h-[44px] py-2 px-3"
          rows={1}
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 bg-black text-white hover:bg-black/90 touch-target flex-shrink-0"
          disabled={disabled || !message.trim()}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
