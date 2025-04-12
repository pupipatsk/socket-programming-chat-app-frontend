"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { mockApi } from "@/lib/mock-api"

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  })

  const toggleMode = () => setIsLogin(!isLogin)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      // For demo purposes, we'll just create a new user or use an existing one
      if (isLogin) {
        // Simulate login by getting a random user
        const users = await mockApi.getActiveUsers()
        const randomUser = users[Math.floor(Math.random() * users.length)]

        localStorage.setItem("user", JSON.stringify(randomUser))
      } else {
        // Register new user
        const newUser = await mockApi.addUser(formData.username)
        localStorage.setItem("user", JSON.stringify(newUser))
      }

      router.push("/chat")
    } catch (error) {
      console.error("Auth failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true)
      const guestName = `Guest-${Math.floor(1000 + Math.random() * 9000)}`
      const guestUser = await mockApi.addUser(guestName)

      localStorage.setItem("user", JSON.stringify(guestUser))
      router.push("/chat")
    } catch (error) {
      console.error("Guest login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-gradient-light">
      <div className="w-1/2 hidden md:flex items-center justify-center p-10 bg-white/40 border-r border-gray-100">
        <h1 className="text-4xl font-light text-black max-w-sm leading-relaxed">
          Connect in Real-Time.
          <br />
          Chat beautifully, simply.
        </h1>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-light">{isLogin ? "Login" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to continue" : "Sign up to join the conversation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="zen-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="zen-input"
                />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="zen-input"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (isLogin ? "Logging in..." : "Creating account...") : isLogin ? "Login" : "Register"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGuestLogin}
                disabled={isLoading}
              >
                Continue as Guest
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-black/60">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={toggleMode} className="text-black font-medium hover:underline ml-1">
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
