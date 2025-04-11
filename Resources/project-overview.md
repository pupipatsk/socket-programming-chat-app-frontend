# Term Project: Socket Programming - Simple Chat Application

## Background
Socket programming is an alternative way of developing a communication channel between two hosts over the network. A socket is bound to a port number to identify the application process. To develop a chat application, students can implement it based on any language socket programming. Students may write their programs in Java, C++, Python, or C on any platform (Linux/Unix, Mac, PC). The client and server processes must be implemented in separate files. The chat application can communicate between two or more computers as a regular chat application.

## Objective
- To understand socket programming
- To apply socket programming with a simple chat application

## Materials
- [Socket programming in Python](https://realpython.com/python-sockets/)
- [Socket.IO - Bidirectional and low-latency communication for every platform](https://socket.io/docs/v4/)
- [Socket.IO and React tutorial](https://developer.okta.com/blog/2021/07/14/socket-io-react-tutorial)
- [Go websocket tutorial](https://tutorialedge.net/golang/go-websocket-tutorial/)
- [WebSockets with Spring](https://www.baeldung.com/websockets-spring)

## Score Criteria (Full score = 12.5 points)
1. (8.5) Fundamental requirement
2. (4.0) Special points

## Requirements

### Fundamental requirement
- (1.5) The system must have at least 2 physical computers (no VMs on the same PC allowed) for implementing the chat application, one for the server and client and others for the client, using Socket Programming.
- (1.0) Each client can set a name.
- (1.0) Each client can see a list of all clients, including themselves, that are currently connected to the server.
- (1.0) Each chat must have a chat box and chat window for sending text messages.
- Private message
    - (1.0) Each client can send a direct text message to other clients in the list. Only the sender and receiver can see the messages.
- Group message
    - (1.0) Each client can create a chat group(s).
    - (1.0) Each client can see a list of all created chat groups, see the members in each group, and join the chat group(s).
    - (1.0) In a chat group, each client must see new incoming text messages from other clients in that chat group. Only the members of the chat group can see the messages.

### Special points (1.0 per feature)
- Auth
- Chat Timestamp
- Chat History
- Delete message
- Edit message
