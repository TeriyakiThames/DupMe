import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';

interface Room {
	id: string;
	createdAt: Date;
	lastActivity: Date;
	userCount: number;
	maxUsers?: number;
	metadata?: Record<string, any>;
}

interface RoomManagerOptions {
	cleanupInterval?: string; // Cron expression, default: '*/5 * * * *' (every 5 minutes)
	maxInactiveTime?: number; // Minutes, default: 30
	maxRooms?: number; // Maximum concurrent rooms, default: 1000
}

export class RoomManager {
	private rooms: Map<string, Room> = new Map();
	private options: Required<RoomManagerOptions>;

	constructor(options: RoomManagerOptions = {}) {
		this.options = {
			cleanupInterval: options.cleanupInterval || '*/5 * * * *', // Every 5 minutes
			maxInactiveTime: options.maxInactiveTime || 30, // 30 minutes
			maxRooms: options.maxRooms || 1000,
		};

		this.startCleanupJob();
	}

	/**
	 * Create a new room with optional metadata: Generate new roomId and add to rooms map
	 */
	createRoom(maxUsers?: number, metadata?: Record<string, any>): string {
		// Check if we've reached the maximum number of rooms
		if (this.rooms.size >= this.options.maxRooms) {
			throw new Error(`Maximum number of rooms (${this.options.maxRooms}) reached`);
		}

		const roomId = this.generateRoomId(); //UUID
		const now = new Date();

		const room: Room = {
			id: roomId,
			createdAt: now,
			lastActivity: now,
			userCount: 0,
			maxUsers,
			metadata,
		};

		this.rooms.set(roomId, room);
		console.log(`Room created: ${roomId} (${this.rooms.size} total rooms)`);
		return roomId;
	}

	/**
	 * Add a user to a room: Increment user count of that room and update last activity
	 */
	joinRoom(roomId: string): boolean {
    //get room
		const room = this.rooms.get(roomId);
		if (!room) {
			return false;
		}

		// Check if room is at capacity
		if (room.maxUsers && room.userCount >= room.maxUsers) {
			return false;
		}

		room.userCount++;
		room.lastActivity = new Date();
		return true;
	}

	/**
	 * Remove a user from a room: Decrement user count of that room and update last activity, delete room if no users remain
	 */
	leaveRoom(roomId: string): boolean {
		const room = this.rooms.get(roomId);
		if (!room) {
			return false;
		}

		room.userCount = Math.max(0, room.userCount - 1);
    room.lastActivity = new Date();
		// Delete room immediately if no users remain
		if (room.userCount === 0) {
			this.rooms.delete(roomId);
			console.log(`Room ${roomId} deleted (empty after user left)`);
		}

		return true;
	}

	/**
	 * Update room activity timestamp: Update last activity to now
	 */
	updateActivity(roomId: string): void {
		const room = this.rooms.get(roomId);
		if (room) {
			room.lastActivity = new Date();
		}
	}

	/**
	 * Check if a room exists: Check if room exists in rooms map
	 */
	roomExists(roomId: string): boolean {
		return this.rooms.has(roomId);
	}

	/**
	 * Get room information: Get room from rooms map
	 */
	getRoomById(roomId: string): Room | undefined {
		return this.rooms.get(roomId);
	}

	/**
	 * Get all rooms: Get all rooms from rooms map
	 */
	getAllRooms(): Room[] {
		return Array.from(this.rooms.values());
	}

	/**
	 * Get room statistics
	 */
	getStats(): {
		totalRooms: number;
		activeRooms: number;
		totalUsers: number;
		emptyRooms: number;
	} {
		const rooms = Array.from(this.rooms.values());
		const activeRooms = rooms.filter(room => room.userCount > 0);
		const emptyRooms = rooms.filter(room => room.userCount === 0);
		const totalUsers = rooms.reduce((sum, room) => sum + room.userCount, 0);

		return {
			totalRooms: rooms.length,
			activeRooms: activeRooms.length,
			totalUsers,
			emptyRooms: emptyRooms.length,
		};
	}

	/**
	 * Delete a specific room
	 */
	deleteRoom(roomId: string): boolean {
		const deleted = this.rooms.delete(roomId);
		if (deleted) {
			console.log(`Room deleted: ${roomId} (${this.rooms.size} remaining rooms)`);
		}
		return deleted;
	}

	/**
	 * Clean up inactive rooms (empty rooms are deleted immediately when user count reaches 0)
	 */
	private cleanupRooms(): void {
		const now = new Date();
		const roomsToDelete: string[] = [];

		for (const [roomId, room] of this.rooms.entries()) {
			const inactiveMinutes = (now.getTime() - room.lastActivity.getTime()) / (1000 * 60);
			
			// Delete rooms that have been inactive for too long (regardless of user count)
			if (inactiveMinutes >= this.options.maxInactiveTime) {
				roomsToDelete.push(roomId);
			}
		}

		// Delete the identified rooms
		roomsToDelete.forEach(roomId => {
			this.rooms.delete(roomId);
			console.log(`Cleaned up inactive room: ${roomId}`);
		});

		if (roomsToDelete.length > 0) {
			console.log(`Cleanup completed: ${roomsToDelete.length} rooms deleted (${this.rooms.size} remaining)`);
		}
	}

	/**
	 * Start the cleanup job: Create a cron job that cleanup inactive rooms every interval
	 */
	private startCleanupJob(): void {
		cron.schedule(this.options.cleanupInterval, () => {
			this.cleanupRooms();
		});

		console.log(`Room cleanup job started (interval: ${this.options.cleanupInterval})`);
	}

	/**
	 * Generate a unique room ID
	 */
	private generateRoomId(): string {
		let roomId: string;
		do {
			// Use a shorter, more user-friendly format
			roomId = uuidv4().substring(0, 8).toUpperCase();
		} while (this.rooms.has(roomId));

		return roomId;
	}

	/**
	 * Shutdown the room manager and stop cleanup job
	 */
	shutdown(): void {
		cron.getTasks().forEach(task => task.stop());
		this.rooms.clear();
		console.log('Room manager shutdown complete');
	}
}
