// socketClient.ts
// Handles low-level socket.io connection
import { UserProfile } from '@/types/auth';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(serverUrl: string, userProfile: UserProfile): Socket {
  if (!socket) {
    socket = io(serverUrl, {
      withCredentials: true,
      auth: { userProfile },
    });
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}
