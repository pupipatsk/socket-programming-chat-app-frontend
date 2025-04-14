// src/lib/mock-api.ts
import type { User, GroupChat, Message } from "@/types"

// Mock data
let users: User[] = [
  { id: "1", username: "Alice", email: "alice@example.com", status: "online" },
  { id: "2", username: "Bob", email: "bob@example.com", status: "online" },
  { id: "3", username: "Charlie", email: "charlie@example.com", status: "online" },
  { id: "4", username: "Diana", email: "diana@example.com", status: "online" },
]

let groups: GroupChat[] = [
  { id: "g1", name: "General", members: ["1", "2", "3"], creator: "1", messages: [] },
  { id: "g2", name: "Development", members: ["1", "3"], creator: "3", messages: [] },
]

const messages: Record<string, Message[]> = {
  user_1_2: [
    {
      id: "m1",
      content: "Hey Bob, how are you?",
      author: "1",
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    },
    {
      id: "m2",
      content: "I'm good, thanks! How about you?",
      author: "2",
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    },
  ],
  user_1_3: [
    {
      id: "m3",
      content: "Hi Charlie, did you finish the report?",
      author: "1",
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    },
  ],
  group_g1: [
    {
      id: "m4",
      content: "Welcome everyone to the General group!",
      author: "1",
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    },
    {
      id: "m5",
      content: "Thanks for creating this group",
      author: "2",
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    },
  ],
  group_g2: [
    {
      id: "m6",
      content: "Let's discuss the new features",
      author: "3",
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    },
  ],
}

// Helper functions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const generateId = () => Math.random().toString(36).substring(2, 9)

// Mock API functions
export const mockApi = {
  getCurrentUser: async (userId: string): Promise<User> => {
    await delay(300)
    const user = users.find((u) => u.id === userId)
    if (!user) throw new Error("User not found")
    return user
  },

  getActiveUsers: async (): Promise<User[]> => {
    await delay(500)
    return users.filter((u) => u.status === "online")
  },

  getGroups: async (): Promise<GroupChat[]> => {
    await delay(500)
    return groups
  },

  createGroup: async (name: string, creatorId: string): Promise<GroupChat> => {
    await delay(700)
    const newGroup: GroupChat = {
      id: `g${generateId()}`,
      name,
      creator: creatorId,
      members: [creatorId],
      messages: [],
    }
    groups = [...groups, newGroup]
    messages[`group_${newGroup.id}`] = []
    return newGroup
  },

  joinGroup: async (groupId: string, userId: string): Promise<GroupChat> => {
    await delay(500)
    const groupIndex = groups.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) throw new Error("Group not found")

    if (!groups[groupIndex].members.includes(userId)) {
      groups[groupIndex].members.push(userId)
    }

    return groups[groupIndex]
  },

  getPrivateMessages: async (userId1: string, userId2: string): Promise<Message[]> => {
    await delay(600)
    const chatId = userId1 < userId2 ? `user_${userId1}_${userId2}` : `user_${userId2}_${userId1}`
    return messages[chatId] || []
  },

  getGroupMessages: async (groupId: string): Promise<Message[]> => {
    await delay(600)
    return messages[`group_${groupId}`] || []
  },

  sendPrivateMessage: async (author: string, to: string, content: string): Promise<Message> => {
    await delay(400)
    const newMessage: Message = {
      id: `m${generateId()}`,
      author,
      content,
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    }
    const chatId = author < to ? `user_${author}_${to}` : `user_${to}_${author}`
    if (!messages[chatId]) messages[chatId] = []
    messages[chatId].push(newMessage)
    return newMessage
  },

  sendGroupMessage: async (groupId: string, author: string, content: string): Promise<Message> => {
    await delay(400)
    const newMessage: Message = {
      id: `m${generateId()}`,
      author,
      content,
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    }
    const chatId = `group_${groupId}`
    if (!messages[chatId]) messages[chatId] = []
    messages[chatId].push(newMessage)
    return newMessage
  },

  addUser: async (username: string, email: string): Promise<User> => {
    await delay(500)
    const newUser: User = {
      id: generateId(),
      username,
      email,
      status: "online",
    }
    users = [...users, newUser]
    return newUser
  },
}
