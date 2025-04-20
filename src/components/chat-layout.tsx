"use client";

import type React from "react";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import Link from "next/link";

interface ChatLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  connectionStatus: string; // still passed but unused now
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  showSidebar?: boolean;
}

export function ChatLayout({
  children,
  user,
  onLogout,
  onToggleSidebar,
  isMobile,
  showSidebar,
}: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gradient-light">
      <header className="border-b border-black/10 p-3 md:p-4 flex justify-between items-center bg-white/5 backdrop-blur-md safe-top">
        <div className="flex items-center space-x-2 md:space-x-4">
          {isMobile && !showSidebar && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="mr-1 touch-target"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          )}
          <Link href="/" className="text-lg md:text-xl font-bold">
            Chat App
          </Link>
          <div className="text-xs md:text-sm text-black/60 hidden sm:block">
            <span className="mr-2">Status:</span>
            <span
              className={
                user.status === "online"
                  ? "text-green-600"
                  : user.status === "offline"
                  ? "text-red-600"
                  : "text-gray-600"
              }
            >
              {user.status || "Unknown"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden sm:block text-sm">
            <span className="text-black/60 mr-1">User:</span>
            <span className="font-medium">{user.username}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="hover:bg-black/5 touch-target"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
