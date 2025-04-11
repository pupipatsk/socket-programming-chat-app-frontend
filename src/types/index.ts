export interface User {
    id: string
    username: string
    status?: "online" | "offline"
  }

  export interface Group {
    id: string
    name: string
    members?: string[]
    createdBy?: string
  }

  export interface Message {
    id?: string
    content: string
    from: string
    to: string
    timestamp: string
    type?: "private" | "group"
  }
