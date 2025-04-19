import type { User, Message, GroupChat, PrivateChat } from "@/types"
import { toGMT7ISOString } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `API error: ${response.status}`)
  }
  return response.json() as Promise<T>
}

function getAuthHeader(token?: string): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

export const api = {
  register: async (token: string, name: string): Promise<any> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: getAuthHeader(token),
      body: JSON.stringify({ name }),
    })
    return handleResponse(response)
  },

  getCurrentUser: async (token: string): Promise<User> => {
    const response = await fetch(`${API_URL}/users/me`, { headers: getAuthHeader(token) })
    const data = await handleResponse<any>(response)
    return {
      id: data.uid,
      username: data.name,
      email: data.email,
      status: data.status.toLowerCase(),
    }
  },

  getActiveUsers: async (token: string): Promise<User[]> => {
    const response = await fetch(`${API_URL}/users/active`, { headers: getAuthHeader(token) })
    const users = await handleResponse<any[]>(response)
    return users.map((user) => ({
      id: user.uid,
      username: user.name,
      email: user.email,
      status: user.status.toLowerCase(),
    }))
  },

  getAllUsers: async (token: string): Promise<User[]> => api.getActiveUsers(token),

  updateUserStatus: async (token: string, status: string): Promise<User> => {
    const response = await fetch(`${API_URL}/users`, {
      method: "PATCH",
      headers: getAuthHeader(token),
      body: JSON.stringify({ status }),
    })
    const data = await handleResponse<any>(response)
    return {
      id: data.user.uid,
      username: data.user.name,
      email: data.user.email,
      status: data.user.status.toLowerCase(),
    }
  },

  getGroups: async (token: string): Promise<GroupChat[]> => {
    const response = await fetch(`${API_URL}/groups`, { headers: getAuthHeader(token) })
    const groups = await handleResponse<any[]>(response)
    return groups.map((group) => ({
      id: group._id,
      name: group.name,
      creator: group.creator,
      members: group.members,
      messages: [],
    }))
  },

  getGroupById: async (token: string, groupId: string): Promise<GroupChat> => {
    const response = await fetch(`${API_URL}/groups/${groupId}`, { headers: getAuthHeader(token) })
    const group = await handleResponse<any>(response)
    const messages: Message[] = (group.messages || []).map((msg: any) => ({
      id: msg._id,
      author: msg.from_user,
      content: msg.content,
      timestamp: toGMT7ISOString(msg.timestamp),
      edited: msg.edited,
      deleted: msg.deleted,
    }))
    return { id: group._id, name: group.name, creator: group.creator, members: group.members, messages }
  },

  createGroup: async (token: string, name: string): Promise<GroupChat> => {
    const response = await fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: getAuthHeader(token),
      body: JSON.stringify({ name }),
    })
    const group = await handleResponse<any>(response)
    return { id: group._id, name: group.name, creator: group.creator, members: group.members, messages: [] }
  },

  joinGroup: async (token: string, groupId: string): Promise<GroupChat> => {
    const response = await fetch(`${API_URL}/groups/join/${groupId}`, {
      method: "POST",
      headers: getAuthHeader(token),
    })
    const group = await handleResponse<any>(response)
    return {
      id: group._id,
      name: group.name,
      creator: group.creator,
      members: group.members,
      messages: group.messages || [],
    }
  },

  getGroupMessages: async (token: string, groupId: string): Promise<Message[]> => {
    const group = await api.getGroupById(token, groupId)
    return group.messages
  },

  sendGroupMessage: async (token: string, groupId: string, content: string): Promise<Message> => {
    const response = await fetch(`${API_URL}/groups/${groupId}/messages`, {
      method: "PATCH",
      headers: getAuthHeader(token),
      body: JSON.stringify({ content }),
    })
    const msg = await handleResponse<any>(response)
    return {
      id: msg._id,
      author: msg.from_user,
      content: msg.content,
      timestamp: toGMT7ISOString(msg.timestamp),
      edited: msg.edited,
      deleted: msg.deleted,
    }
  },

  editGroupMessage: async (token: string, groupId: string, messageId: string, content: string): Promise<Message> => {
    const response = await fetch(`${API_URL}/groups/${groupId}/messages/${messageId}`, {
      method: "PATCH",
      headers: getAuthHeader(token),
      body: JSON.stringify({ content }),
    })
    const msg = await handleResponse<any>(response)
    return {
      id: msg._id,
      author: msg.from_user,
      content: msg.content,
      timestamp: toGMT7ISOString(msg.timestamp),
      edited: msg.edited,
      deleted: msg.deleted,
    }
  },

  deleteGroupMessage: async (token: string, groupId: string, messageId: string): Promise<Message> => {
    const response = await fetch(`${API_URL}/groups/${groupId}/messages/${messageId}`, {
      method: "DELETE",
      headers: getAuthHeader(token),
    })
    const result = await handleResponse<any>(response)
    return {
      id: result.data._id,
      author: result.data.from_user,
      content: result.data.content,
      timestamp: toGMT7ISOString(result.data.timestamp),
      edited: result.data.edited,
      deleted: result.data.deleted,
    }
  },

  getPrivateChat: async (token: string, userId1: string, userId2: string): Promise<PrivateChat> => {
    const response = await fetch(`${API_URL}/private-chats`, {
      method: "POST",
      headers: getAuthHeader(token),
      body: JSON.stringify({ other_uid: userId2 }),
    })
    const result = await handleResponse<any>(response)
    const chat = result.chat
    const messages: Message[] = (chat.messages || []).map((msg: any) => ({
      id: msg._id,
      author: msg.from_user,
      content: msg.content,
      timestamp: toGMT7ISOString(msg.timestamp),
      edited: msg.edited,
      deleted: msg.deleted,
    }))
    return { id: chat._id, members: chat.members, messages }
  },

  getPrivateMessages: async (token: string, userId1: string, userId2: string): Promise<Message[]> => {
    const chat = await api.getPrivateChat(token, userId1, userId2)
    return chat.messages
  },

  sendPrivateMessage: async (token: string, chatId: string, content: string): Promise<Message> => {
    const response = await fetch(`${API_URL}/private-chats/${chatId}/messages`, {
      method: "PATCH",
      headers: getAuthHeader(token),
      body: JSON.stringify({ content }),
    })
    const msg = await handleResponse<any>(response)
    return {
      id: msg._id,
      author: msg.from_user,
      content: msg.content,
      timestamp: toGMT7ISOString(msg.timestamp),
      edited: msg.edited,
      deleted: msg.deleted,
    }
  },

  editPrivateMessage: async (token: string, chatId: string, messageId: string, content: string): Promise<Message> => {
    const response = await fetch(`${API_URL}/private-chats/${chatId}/messages/${messageId}`, {
      method: "PATCH",
      headers: getAuthHeader(token),
      body: JSON.stringify({ content }),
    })
    const msg = await handleResponse<any>(response)
    return {
      id: msg._id,
      author: msg.from_user,
      content: msg.content,
      timestamp: toGMT7ISOString(msg.timestamp),
      edited: msg.edited,
      deleted: msg.deleted,
    }
  },

  deletePrivateMessage: async (token: string, chatId: string, messageId: string): Promise<Message> => {
    const response = await fetch(`${API_URL}/private-chats/${chatId}/messages/${messageId}`, {
      method: "DELETE",
      headers: getAuthHeader(token),
    })
    const result = await handleResponse<any>(response)
    return {
      id: result.data._id,
      author: result.data.from_user,
      content: result.data.content,
      timestamp: toGMT7ISOString(result.data.timestamp),
      edited: result.data.edited,
      deleted: result.data.deleted,
    }
  },
}
