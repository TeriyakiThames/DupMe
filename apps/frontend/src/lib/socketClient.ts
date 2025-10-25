// socketClient.ts
// Handles low-level socket.io connection
import { io, Socket } from 'socket.io-client';
const URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL_LOCAL as string;

let socket: Socket | null = null;
export function initSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      withCredentials: true,
    });
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}
