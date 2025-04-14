"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types"
import { mockApi } from "@/lib/mock-api"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  guestLogin: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      const users = await mockApi.getActiveUsers()
      const user = users.find((u) => u.username === username)

      if (!user) {
        throw new Error("User not found")
      }

      localStorage.setItem("user", JSON.stringify(user))
      setUser(user)
      router.push("/chat")

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      })
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string) => {
    try {
      setIsLoading(true)
      const newUser = await mockApi.addUser(username, email)
      localStorage.setItem("user", JSON.stringify(newUser))
      setUser(newUser)
      router.push("/chat")

      toast({
        title: "Registration successful",
        description: `Welcome, ${newUser.username}!`,
      })
    } catch (error) {
      console.error("Registration failed:", error)
      toast({
        title: "Registration failed",
        description: "Could not create account",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const guestLogin = async () => {
    try {
      setIsLoading(true)
      const guestName = `Guest-${Math.floor(1000 + Math.random() * 9000)}`
      const guestUser = await mockApi.addUser(guestName, `${guestName}@guest.io`)
      localStorage.setItem("user", JSON.stringify(guestUser))
      setUser(guestUser)
      router.push("/chat")

      toast({
        title: "Guest login successful",
        description: `Welcome, ${guestUser.username}!`,
      })
    } catch (error) {
      console.error("Guest login failed:", error)
      toast({
        title: "Guest login failed",
        description: "Could not create guest account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/")

    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
