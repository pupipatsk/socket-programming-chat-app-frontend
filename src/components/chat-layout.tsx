"use client"

import type React from "react"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import Link from "next/link"

interface ChatLayoutProps {
  children: React.ReactNode
  user: User
  onLogout: () => void
  connectionStatus: string
}

export function ChatLayout({ children, user, onLogout, connectionStatus }: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gradient-light">
      <header className="border-b border-black/10 p-4 flex justify-between items-center bg-white/5 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold">
            Chat Application
          </Link>
          <div className="text-sm text-black/60">
            <span className="mr-2">Status:</span>
            <span
              className={
                connectionStatus === "Connected"
                  ? "text-green-600"
                  : connectionStatus
                    ? "text-red-600"
                    : "text-gray-600"
              }
            >
              {connectionStatus || "Unknown"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block">
            Logged in as <span className="font-bold">{user.username}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="hover:bg-black/5">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
