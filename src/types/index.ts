// src/types/index.ts

export interface User {
  id: string;
  username: string;
  email: string;
  status: "online" | "offline";
  private_chats?: string[]; // Array of PrivateChat IDs
  groups?: string[]; // Array of GroupChat IDs
}

export interface Message {
  id: string;
  author: string; // User ID
  content: string;
  timestamp: string; // ISODate string
  edited: boolean;
  deleted: boolean;
}

export interface PrivateChat {
  id: string;
  members: string[]; // User IDs (at least 2)
  messages: Message[];
}

export interface GroupChat {
  id: string;
  name: string;
  creator: string; // User ID
  members: string[]; // User IDs
  messages: Message[];
}
