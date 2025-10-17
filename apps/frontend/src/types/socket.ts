import { Note, GameMode } from "./game";
import { Socket } from "socket.io-client";

export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UseSocketReturn {
  // Connection state
  // isConnected: boolean;
  // playerId: string | null;
  socket: Socket | null;
  isConnected: boolean;
  
  // Room operations
  joinRoom: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  getRoomInfo: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Game operations
  startGame: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  endGame: (roomId: string, scores: Record<string, number>, winner: string) => Promise<{ success: boolean; error?: string }>;
  resetGame: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getGameState: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Game-specific methods (via gameService)
  submitNote: (roomId: string, note: string, playerId: string) => Promise<{ success: boolean; error?: string }>;
  releaseNote: (roomId: string, note: string, playerId: string) => Promise<{ success: boolean; error?: string }>;
  increasePoint: (roomId: string, userName: string, points: number) => Promise<{ success: boolean; error?: string }>;
  decreasePoint: (roomId: string, userName: string, points: number) => Promise<{ success: boolean; error?: string }>;
  savePattern: (roomId: string, turnId: string, pattern: string[]) => Promise<{ success: boolean; data?: any; error?: string }>;
  checkPattern: (roomId: string, turnId: string, note: string, index: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Messaging
  sendMessage: (roomId: string, message: string) => Promise<{ success: boolean; error?: string }>;
  
  // Room event subscription helpers
  onUserJoined: (callback: (data: any) => void) => () => void;
  onUserLeft: (callback: (data: any) => void) => () => void;
  onMessageReceived: (callback: (data: any) => void) => () => void;
  onGameStarted: (callback: (data: any) => void) => () => void;
  onGameEnded: (callback: (data: any) => void) => () => void;
  onGameReset: (callback: (data: any) => void) => () => void;
  
  // Game event subscription helpers (via gameService)
  onNotePress: (callback: (data: any) => void) => () => void;
  onNoteRelease: (callback: (data: any) => void) => () => void;
  onScoreUpdate: (callback: (data: any) => void) => () => void;
  onTurnChange: (callback: (data: any) => void) => () => void;
  onPatternComplete: (callback: (data: any) => void) => () => void;
}

export interface SocketEvents {
  "note:down": { note: Note; user: string };
  "note:up": { note: Note; user: string };
  "turn:change": { turn: "Create" | "Reproduce"; user: string };
  "pattern:final": { pattern: Note[] };
  "mode:set": { mode: GameMode };
  "score:update": { user: string; points: number };
  "game:end": { winner: string };
}

export interface SocketManagerConfig {
  serverUrl?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}