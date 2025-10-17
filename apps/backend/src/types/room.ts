import { RoomManager } from '../managers/roomManager';

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