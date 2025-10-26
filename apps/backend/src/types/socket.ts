import { Socket } from 'socket.io';
import { UserProfile } from './auth';
import { RoomManager } from '../managers/roomManager';  
import { IncomingMessage } from 'http';
import { SessionData } from 'express-session';

// Define SessionData
declare module 'express-session' {
    interface SessionData {
        userProfile: UserProfile
        currentRoomId?: string;
        isAuthenticated?: boolean;
    }
};

// Extend IncomingMessage to include SessionData
interface SessionIncomingMessage extends IncomingMessage {
    session: SessionData
};

// Extend Socket to include modified SessionIncomingMessage
export interface SessionSocket extends Socket {
    request: SessionIncomingMessage
};


export interface Room {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  userCount: number;
  players: Set<number>; // Track player IDs
  roomManager: RoomManager; // Each room has its own RoomManager instance
  maxUsers?: number;
  metadata?: Record<string, any>;
}

export interface ServerManagerOptions {
  cleanupInterval?: string; // Cron expression, default: '*/5 * * * *' (every 5 minutes)
  maxInactiveTime?: number; // Minutes, default: 30
  maxRooms?: number; // Maximum concurrent rooms, default: 1000
}

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
