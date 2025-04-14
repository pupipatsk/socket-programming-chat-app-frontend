// src/lib/mock-api.ts
import type { User, GroupChat, Message, PrivateChat } from "@/types";

// Mock data
let users: User[] = [
  { id: "1", username: "Alice", email: "alice@example.com", status: "online" },
  { id: "2", username: "Bob", email: "bob@example.com", status: "online" },
  {
    id: "3",
    username: "Charlie",
    email: "charlie@example.com",
    status: "offline",
  },
  { id: "4", username: "Diana", email: "diana@example.com", status: "offline" },
  { id: "5", username: "Eva", email: "eva@example.com", status: "online" },
  { id: "6", username: "Frank", email: "frank@example.com", status: "offline" },
  { id: "7", username: "Grace", email: "grace@example.com", status: "online" },
  { id: "8", username: "Henry", email: "henry@example.com", status: "offline" },
];

let groups: GroupChat[] = [
  {
    id: "g1",
    name: "General",
    members: ["1", "2", "3"],
    creator: "1",
    messages: [
      {
        id: "m4",
        content: "Welcome everyone to the General group!",
        author: "1",
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        edited: false,
        deleted: false,
      },
      {
        id: "m5",
        content: "Thanks for creating this group",
        author: "2",
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        edited: false,
        deleted: false,
      },
    ],
  },
  {
    id: "g2",
    name: "Development",
    members: ["1", "3"],
    creator: "3",
    messages: [
      {
        id: "m6",
        content: "Let's discuss the new features",
        author: "3",
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        edited: false,
        deleted: false,
      },
    ],
  },
];

const privateChats: PrivateChat[] = [
  {
    id: "pc1",
    members: ["1", "2"],
    messages: [
      {
        id: "m1",
        content: "Hey Bob, how are you?",
        author: "1",
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        edited: false,
        deleted: false,
      },
      {
        id: "m2",
        content: "I'm good, thanks! How about you?",
        author: "2",
        timestamp: new Date(Date.now() - 7000000).toISOString(), // A bit less than 2 hours ago
        edited: false,
        deleted: false,
      },
    ],
  },
  {
    id: "pc2",
    members: ["1", "3"],
    messages: [
      {
        id: "m3",
        content: "Hi Charlie, did you finish the report?",
        author: "1",
        timestamp: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
        edited: false,
        deleted: false,
      },
    ],
  },
];

// Helper functions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const generateId = () => Math.random().toString(36).substring(2, 9);

// Find or create private chat between two users
const findOrCreatePrivateChat = (
  userId1: string,
  userId2: string
): PrivateChat => {
  const existingChat = privateChats.find(
    (chat) =>
      chat.members.includes(userId1) &&
      chat.members.includes(userId2) &&
      chat.members.length === 2
  );

  if (existingChat) return existingChat;

  const newChat: PrivateChat = {
    id: `pc${generateId()}`,
    members: [userId1, userId2],
    messages: [],
  };

  privateChats.push(newChat);
  return newChat;
};

// Mock API functions
export const mockApi = {
  // User related functions
  getCurrentUser: async (userId: string): Promise<User> => {
    await delay(300);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    return user;
  },

  getAllUsers: async (): Promise<User[]> => {
    await delay(500);
    return [...users].sort((a, b) => {
      // Sort by status (online first)
      if (a.status !== b.status) {
        return a.status === "online" ? -1 : 1;
      }
      // Then sort alphabetically by username
      return a.username.localeCompare(b.username);
    });
  },

  getActiveUsers: async (): Promise<User[]> => {
    await delay(500);
    return users
      .filter((u) => u.status === "online")
      .sort((a, b) => a.username.localeCompare(b.username));
  },

  toggleUserStatus: async (userId: string): Promise<User> => {
    await delay(300);
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    users[userIndex].status =
      users[userIndex].status === "online" ? "offline" : "online";
    return users[userIndex];
  },

  // Group related functions
  getGroups: async (): Promise<GroupChat[]> => {
    await delay(500);
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  },

  getGroupById: async (groupId: string): Promise<GroupChat> => {
    await delay(300);
    const group = groups.find((g) => g.id === groupId);
    if (!group) throw new Error("Group not found");
    return group;
  },

  createGroup: async (name: string, creatorId: string): Promise<GroupChat> => {
    await delay(700);
    const newGroup: GroupChat = {
      id: `g${generateId()}`,
      name,
      creator: creatorId,
      members: [creatorId],
      messages: [],
    };
    groups = [...groups, newGroup];
    return newGroup;
  },

  joinGroup: async (groupId: string, userId: string): Promise<GroupChat> => {
    await delay(500);
    const groupIndex = groups.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) throw new Error("Group not found");

    if (!groups[groupIndex].members.includes(userId)) {
      groups[groupIndex].members.push(userId);
    }

    return groups[groupIndex];
  },

  addMemberToGroup: async (
    groupId: string,
    userId: string
  ): Promise<GroupChat> => {
    await delay(500);
    const groupIndex = groups.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) throw new Error("Group not found");

    const userExists = users.some((u) => u.id === userId);
    if (!userExists) throw new Error("User not found");

    if (!groups[groupIndex].members.includes(userId)) {
      groups[groupIndex].members.push(userId);
    }

    return groups[groupIndex];
  },

  getGroupMembers: async (groupId: string): Promise<User[]> => {
    await delay(500);
    const group = groups.find((g) => g.id === groupId);
    if (!group) throw new Error("Group not found");

    return users
      .filter((user) => group.members.includes(user.id))
      .sort((a, b) => {
        // Sort by status (online first)
        if (a.status !== b.status) {
          return a.status === "online" ? -1 : 1;
        }
        // Then sort alphabetically by username
        return a.username.localeCompare(b.username);
      });
  },

  // Chat related functions
  getPrivateChat: async (
    userId1: string,
    userId2: string
  ): Promise<PrivateChat> => {
    await delay(600);
    return findOrCreatePrivateChat(userId1, userId2);
  },

  getPrivateMessages: async (
    userId1: string,
    userId2: string
  ): Promise<Message[]> => {
    await delay(600);
    const chat = findOrCreatePrivateChat(userId1, userId2);
    return [...chat.messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  getGroupMessages: async (groupId: string): Promise<Message[]> => {
    await delay(600);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    return [...group.messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  sendPrivateMessage: async (
    author: string,
    to: string,
    content: string
  ): Promise<Message> => {
    await delay(400);
    const newMessage: Message = {
      id: `m${generateId()}`,
      author,
      content,
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    };

    const chat = findOrCreatePrivateChat(author, to);
    chat.messages.push(newMessage);

    return newMessage;
  },

  sendGroupMessage: async (
    groupId: string,
    author: string,
    content: string
  ): Promise<Message> => {
    await delay(400);
    const newMessage: Message = {
      id: `m${generateId()}`,
      author,
      content,
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
    };

    const groupIndex = groups.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) throw new Error("Group not found");

    groups[groupIndex].messages.push(newMessage);
    return newMessage;
  },

  editMessage: async (
    chatType: "private" | "group",
    chatId: string,
    messageId: string,
    newContent: string
  ): Promise<Message> => {
    await delay(400);

    if (chatType === "private") {
      const chatIndex = privateChats.findIndex((chat) => chat.id === chatId);
      if (chatIndex === -1) throw new Error("Chat not found");

      const messageIndex = privateChats[chatIndex].messages.findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex === -1) throw new Error("Message not found");

      privateChats[chatIndex].messages[messageIndex].content = newContent;
      privateChats[chatIndex].messages[messageIndex].edited = true;

      return privateChats[chatIndex].messages[messageIndex];
    } else {
      const groupIndex = groups.findIndex((g) => g.id === chatId);
      if (groupIndex === -1) throw new Error("Group not found");

      const messageIndex = groups[groupIndex].messages.findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex === -1) throw new Error("Message not found");

      groups[groupIndex].messages[messageIndex].content = newContent;
      groups[groupIndex].messages[messageIndex].edited = true;

      return groups[groupIndex].messages[messageIndex];
    }
  },

  deleteMessage: async (
    chatType: "private" | "group",
    chatId: string,
    messageId: string
  ): Promise<Message> => {
    await delay(400);

    if (chatType === "private") {
      const chatIndex = privateChats.findIndex((chat) => chat.id === chatId);
      if (chatIndex === -1) throw new Error("Chat not found");

      const messageIndex = privateChats[chatIndex].messages.findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex === -1) throw new Error("Message not found");

      privateChats[chatIndex].messages[messageIndex].deleted = true;

      return privateChats[chatIndex].messages[messageIndex];
    } else {
      const groupIndex = groups.findIndex((g) => g.id === chatId);
      if (groupIndex === -1) throw new Error("Group not found");

      const messageIndex = groups[groupIndex].messages.findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex === -1) throw new Error("Message not found");

      groups[groupIndex].messages[messageIndex].deleted = true;

      return groups[groupIndex].messages[messageIndex];
    }
  },

  addUser: async (username: string, email: string): Promise<User> => {
    await delay(500);
    const newUser: User = {
      id: generateId(),
      username,
      email,
      status: "online",
    };
    users = [...users, newUser];
    return newUser;
  },
};
