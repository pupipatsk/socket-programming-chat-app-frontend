import { Skeleton } from "@/components/ui/skeleton"

export function ChatPageSkeleton() {
  return (
    <div className="flex h-screen bg-gradient-light">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col border-r border-black/5 responsive-sidebar p-4 space-y-6 bg-gradient-sidebar">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-black/10 p-4 bg-white/5 backdrop-blur-md">
          <Skeleton className="h-6 w-1/3" />
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex">
              <Skeleton className="h-6 w-2/3 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-black/10 bg-white/5">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}