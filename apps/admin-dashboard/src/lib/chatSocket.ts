/**
 * One live connection to the chat (comms /messages) for the whole dashboard.
 * The server decides what this login may hear; the client never asks to join rooms.
 */
import { io, type Socket } from 'socket.io-client'

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'http://localhost:3005'

let socket: Socket | null = null
let tokenInUse: string | null = null

export function chatSocket(token: string | null): Socket | null {
  if (!token) { closeChatSocket(); return null }
  if (socket && tokenInUse === token) return socket
  closeChatSocket()
  tokenInUse = token
  socket = io(`${WS_URL}/messages`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  })
  return socket
}

export function closeChatSocket() {
  socket?.disconnect()
  socket = null
  tokenInUse = null
}

export function currentChatSocket(): Socket | null {
  return socket
}
