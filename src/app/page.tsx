import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-light dark:bg-gradient-dark transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Chat Application</CardTitle>
          <CardDescription>Sign in to start chatting</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Link href="/login" passHref className="w-full">
            <Button className="w-full mb-4 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
              Log In
            </Button>
          </Link>
          <Link href="/register" passHref className="w-full">
            <Button
              variant="outline"
              className="w-full border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Create Account
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
