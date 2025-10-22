import { UserProfile } from "./auth";
import { Note, GameMode } from "./components";
import { Socket } from "socket.io-client";

// Client to server requests
export interface ServerEventRequest {
  userProfile: UserProfile;
  maxUsers?: number;
  metadata?: Record<string, any>;
  roomId?: string;
}


// Server to client responses
export interface ServerEventResponse {
  success: boolean;
  roomId: string;
  message: string;
  playerCount?: number;
  idUsernameMap?: Record<number, string>;
  maxUsers?: number;
  createdAt?: string;
  lastActivity?: string;
  metadata?: Record<string, any>;
  totalRooms?: number;
  activeRooms?: number;
  totalUsers?: number;
  emptyRooms?: number;
  onlineUsers?: Set<string>;

}

// Server to client broadcasts
export interface ServerEventBroadcast {
  roomId: string;
  playerId?: number;
  username?: string;
  message: string;
  playerCount?: number;
  remainingPlayers?: number;
  totalRooms?: number;
  activeRooms?: number;
  totalUsers?: number;
  emptyRooms?: number;
  onlineUsers?: Set<string>;
  
}
