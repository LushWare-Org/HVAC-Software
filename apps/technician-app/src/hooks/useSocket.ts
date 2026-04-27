/**
 * useSocket — re-exports the shared singleton socket from SocketContext.
 *
 * Previously this hook created a new socket.io connection per component mount,
 * causing duplicate connections and leaky listeners. Now it simply returns
 * the single shared connection managed by SocketProvider in _layout.tsx.
 */
export { useSocketContext as useSocket } from '@/contexts/SocketContext'
