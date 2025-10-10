import { io, Socket } from "socket.io-client";
import type { Note, GameMode } from "@/lib/types";

let socket: Socket | null = null;

export function initSocket(roomCode: string, userId: string) {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000", {
      query: { roomCode, userId },
      transports: ["websocket"],
    });
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

// --- Example event types you can prepare for ---
export interface SocketEvents {
  "note:down": { note: Note; user: string };
  "note:up": { note: Note; user: string };
  "turn:change": { turn: "Create" | "Reproduce"; user: string };
  "pattern:final": { pattern: Note[] };
  "mode:set": { mode: GameMode };
  "score:update": { user: string; points: number };
  "game:end": { winner: string };
}
