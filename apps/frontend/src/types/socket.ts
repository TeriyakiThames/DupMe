import type { UserProfile } from "@/types/auth";

// Client to server requests
export interface ServerEventRequest {
  userProfile?: UserProfile;
  maxUsers?: number;
  metadata?: Record<string, string>;
  roomId?: string;
}

// Server to client broadcasts
export interface ServerEventBroadcast {
  roomId: string;
  playerId?: number;
  username?: string;
  success?: boolean;
  error?: string;
  message: string;
  playerCount?: number;
  remainingPlayers?: number;
  totalRooms?: number;
  activeRooms?: number;
  totalUsers?: number;
  emptyRooms?: number;
  onlineUsers?: Set<string>;
  
}
