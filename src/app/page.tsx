// src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const toggleMode = () => setIsLogin(!isLogin);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: formData.username,
          id: "user_" + Math.random().toString(36).substr(2, 9),
        })
      );
      router.push("/chat");
    } catch (error) {
      console.error("Auth failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestId = Math.floor(1 + Math.random() * 10).toString();
    const guestUser = {
      username: `Guest-${guestId}`,
      id: guestId,
    };
    localStorage.setItem("user", JSON.stringify(guestUser));
    router.push("/chat");
  };

  return (
    <main className="flex min-h-screen">
      <div className="w-1/2 hidden md:flex items-center justify-center p-10 bg-white/40 border-r border-gray-200">
        <h1 className="text-4xl font-light text-black max-w-sm leading-relaxed">
          Connect in Real-Time.
          <br />
          Chat beautifully, simply.
        </h1>
      </div>

      <div
        className="w-full md:w-1/2 flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
        }}
      >
        <Card className="w-full max-w-md glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Login" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your credentials to continue"
                : "Sign up to join the conversation"}
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
                  className="glass-input"
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
                  className="glass-input"
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
                    className="glass-input"
                  />
                </div>
              )}
              <Button
                type="submit"
                // variant="default"
                className="w-full bg-black text-white hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading
                  ? isLogin
                    ? "Logging in..."
                    : "Creating account..."
                  : isLogin
                  ? "Login"
                  : "Register"}
              </Button>
              <Button
                type="button"
                className="w-full bg-gray-100 text-black hover:bg-gray-200"
                onClick={handleGuestLogin}
              >
                Continue as Guest
              </Button>
            </form>
          </CardContent>
          {/* Footer: Don't have an account? Register */}
          <CardFooter className="flex justify-center">
            <p className="text-sm text-black/60">
              {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-black font-medium hover:underline ml-1"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
