import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function initSocket(roomCode: string, userId: number) {
  if (!socket) {
    socket = io(process.env.BACKEND_URL || 'http://localhost:4000', {
      query: { roomCode, userId },
      transports: ["websocket"],
    });
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}
