# Project

## Tech stack
- Design style: Zen, Glassmorphism, McKinsey
- Frontend: Next.js
  - Tailwind CSS version 3 / ShadCN
  - React
  - Socket.IO
- Backend: FastAPI
- Database: MongoDB

## Requirements
- Min: 2 client, 1 server
- Set client name
- Lis of active users
- Chat box + chat window
- Private/Direct messages (only sender & receiver see)
- Create chat groups
- View & join groups, see members
- Group messages (only group members see)

## Special feature
- Auth
- Chat Timestamp
- Chat History
- Delete message
- Edit message

## Role
- Backend developer 1: Neo
- Backend developer 2: Kong
- Frontend developer: Get
- System Analyst: Most


# Schema

## User

```json
{
  "id": ObjectId,
  "user_name": string,
  "email": string,
  "status": string,
  "private_chats": [ObjectId],
  "groups": [ObjectId]
}
```

## Private Chats

```json
{
  "id": ObjectId,
  "members": [UserId], // Min 2 members per chat
  "messages": [Message]
}
```

## Group Chats

```json
{
  "id": ObjectId,
  "name": string,
  "creator": UserId,
  "members": [UserId],
  "messages": [Message]
}
```

## Message

```json
{
  "id": ObjectId,
  "author": ObjectId (UserId),
  "content": string,
  "timestamp": ISODate(),
  "edited": boolean,
  "deleted": boolean
}
```

# API Routes

## Auth

- `POST /internal/login` — Login
- `POST /internal/register` — Register

## User

- `GET /users/active` — List active (online) users
- `GET /users/me` — Get current user info
- `PATCH /users/{user_id}` — Update user status

## Private Chat

- `POST /private_chats/` — Start a private chat
- `GET /private_chats/{chat_id}` — Get private chat history
- `PATCH /private_chats/{chat_id}/messages` — Edit private chat message
- `PATCH /private_chats/{chat_id}/messages/{message_id}` — Edit private chat message
- `DELETE /private_chats/{chat_id}/messages/{message_id}` — Delete private chat message

## Group Chat

- `POST /groups/` — Create group
- `GET /groups/` — Get list of groups
- `GET /groups/{group_id}` — Get group info and message history
- `POST /groups/join/{group_id}` — Join group
- `PATCH /groups/{group_id}/messages` — Send group message
- `PATCH /groups/{group_id}/messages/{message_id}` — Edit group message
- `DELETE /groups/{group_id}/messages/{message_id}` — Delete group message
