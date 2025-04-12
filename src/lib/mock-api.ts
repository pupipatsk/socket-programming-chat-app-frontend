import type { User, Group, Message } from "@/types"

// Mock data
let users: User[] = [
  { id: "1", username: "Alice", status: "online" },
  { id: "2", username: "Bob", status: "online" },
  { id: "3", username: "Charlie", status: "online" },
  { id: "4", username: "Diana", status: "online" },
]

let groups: Group[] = [
  { id: "g1", name: "General", members: ["1", "2", "3"], createdBy: "1" },
  { id: "g2", name: "Development", members: ["1", "3"], createdBy: "3" },
]

const messages: Record<string, Message[]> = {
  // Private messages
  user_1_2: [
    {
      id: "m1",
      content: "Hey Bob, how are you?",
      from: "1",
      to: "2",
      timestamp: new Date().toISOString(),
      type: "private",
    },
    {
      id: "m2",
      content: "I'm good, thanks! How about you?",
      from: "2",
      to: "1",
      timestamp: new Date().toISOString(),
      type: "private",
    },
  ],
  user_1_3: [
    {
      id: "m3",
      content: "Hi Charlie, did you finish the report?",
      from: "1",
      to: "3",
      timestamp: new Date().toISOString(),
      type: "private",
    },
  ],
  // Group messages
  group_g1: [
    {
      id: "m4",
      content: "Welcome everyone to the General group!",
      from: "1",
      to: "g1",
      timestamp: new Date().toISOString(),
      type: "group",
    },
    {
      id: "m5",
      content: "Thanks for creating this group",
      from: "2",
      to: "g1",
      timestamp: new Date().toISOString(),
      type: "group",
    },
  ],
  group_g2: [
    {
      id: "m6",
      content: "Let's discuss the new features",
      from: "3",
      to: "g2",
      timestamp: new Date().toISOString(),
      type: "group",
    },
  ],
}

// Helper functions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const generateId = () => Math.random().toString(36).substring(2, 9)

// Mock API functions
export const mockApi = {
  // User related
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

  // Group related
  getGroups: async (): Promise<Group[]> => {
    await delay(500)
    return groups
  },

  createGroup: async (name: string, creatorId: string): Promise<Group> => {
    await delay(700)
    const newGroup: Group = {
      id: `g${generateId()}`,
      name,
      members: [creatorId],
      createdBy: creatorId,
    }
    groups = [...groups, newGroup]
    messages[`group_${newGroup.id}`] = []
    return newGroup
  },

  joinGroup: async (groupId: string, userId: string): Promise<Group> => {
    await delay(500)
    const groupIndex = groups.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) throw new Error("Group not found")

    // Only add user if not already a member
    if (!groups[groupIndex].members?.includes(userId)) {
      groups[groupIndex] = {
        ...groups[groupIndex],
        members: [...(groups[groupIndex].members || []), userId],
      }
    }

    return groups[groupIndex]
  },

  // Message related
  getPrivateMessages: async (userId1: string, userId2: string): Promise<Message[]> => {
    await delay(600)
    const chatId = userId1 < userId2 ? `user_${userId1}_${userId2}` : `user_${userId2}_${userId1}`
    return messages[chatId] || []
  },

  getGroupMessages: async (groupId: string): Promise<Message[]> => {
    await delay(600)
    return messages[`group_${groupId}`] || []
  },

  sendPrivateMessage: async (message: Omit<Message, "id">): Promise<Message> => {
    await delay(400)
    const newMessage: Message = {
      ...message,
      id: `m${generateId()}`,
      timestamp: new Date().toISOString(),
      type: "private",
    }

    const fromId = message.from
    const toId = message.to
    const chatId = fromId < toId ? `user_${fromId}_${toId}` : `user_${toId}_${fromId}`

    if (!messages[chatId]) {
      messages[chatId] = []
    }

    messages[chatId] = [...messages[chatId], newMessage]
    return newMessage
  },

  sendGroupMessage: async (message: Omit<Message, "id">): Promise<Message> => {
    await delay(400)
    const newMessage: Message = {
      ...message,
      id: `m${generateId()}`,
      timestamp: new Date().toISOString(),
      type: "group",
    }

    const groupId = message.to
    const chatId = `group_${groupId}`

    if (!messages[chatId]) {
      messages[chatId] = []
    }

    messages[chatId] = [...messages[chatId], newMessage]
    return newMessage
  },

  // Add a user to the system (for login/register simulation)
  addUser: async (username: string): Promise<User> => {
    await delay(500)
    const newUser: User = {
      id: generateId(),
      username,
      status: "online",
    }
    users = [...users, newUser]
    return newUser
  },
}
