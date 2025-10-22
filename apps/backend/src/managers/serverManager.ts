import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';
import { RoomManager } from './roomManager';
import { UserProfile as Player, UserProfile } from '../types/auth';
import { Room, ServerManagerOptions } from '../types/socket';

export class ServerManager {
	private onlineUsers: Set<string> = new Set();
	private rooms: Map<string, Room> = new Map();
	private options: Required<ServerManagerOptions>;

	constructor(options: ServerManagerOptions = {}) {
		this.options = {
			cleanupInterval: options.cleanupInterval || '*/5 * * * *', // Every 5 minutes
			maxInactiveTime: options.maxInactiveTime || 30, // 30 minutes
			maxRooms: options.maxRooms || 1000,
		};

		this.startCleanupJob();
	}

	/**
	 * Create a new room with players: Generate new roomId and add to rooms map
	 */
	createRoom(players: Player[], maxUsers?: number, metadata?: Record<string, any>): string {
		// Check if we've reached the maximum number of rooms
		if (this.rooms.size >= this.options.maxRooms) {
			throw new Error(`Maximum number of rooms (${this.options.maxRooms}) reached`);
		}

		if (players.length === 0) {
			throw new Error('Cannot create room without players');
		}

		const roomId = this.generateRoomId();
		const now = new Date();

		// Create a dedicated RoomManager instance for this room with players
		const roomManager = new RoomManager(roomId, players);

		const room: Room = {
			id: roomId,
			createdAt: now,
			lastActivity: now,
			userCount: players.length,
			players: new Set(players.map(p => p.id)),
			roomManager,
			maxUsers,
			metadata,
		};

		this.rooms.set(roomId, room);
		console.log(`Room created: ${roomId} with ${players.length} players (${this.rooms.size} total rooms)`);
		return roomId;
	}


	/**
	 * Add a user to a room: Increment user count of that room and update last activity
	 */
	joinRoom(roomId: string, userProfile: UserProfile): boolean {
		const room = this.rooms.get(roomId);
		if (!room) {
			return false;
		}

		// Check if player is already in the room
		if (room.players.has(userProfile.id)) {
			return false;
		}

		// Check if room is at capacity
		if (room.maxUsers && room.userCount >= room.maxUsers) {
			return false;
		}

		// Add player to Room
		room.players.add(userProfile.id);
		// Add full user profile to RoomManager
		room.roomManager.players.push(userProfile);
		room.userCount++;
		room.lastActivity = new Date();
		return true;
	}

	/**
	 * Remove a user from a room: Decrement user count of that room and update last activity, delete room if no users remain
	 */
	leaveRoom(roomId: string, playerId: number): boolean {
		const room = this.rooms.get(roomId);
		if (!room) {
			return false;
		}

		// Only decrement if player was actually in the room
		if (room.players.has(playerId)) {
			room.players.delete(playerId);
			room.userCount = Math.max(0, room.userCount - 1);
			room.lastActivity = new Date();
			
			// Delete room immediately if no users remain
			if (room.userCount === 0) {
				// Cleanup the RoomManager instance
				room.roomManager.destroy();
				this.rooms.delete(roomId);
				console.log(`Room ${roomId} deleted (empty after user left)`);
			}
			return true;
		}

		return false;
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
	 * Get all player IDs in a specific room
	 */
	getPlayersInRoom(roomId: string): number[] {
		const room = this.rooms.get(roomId);
		return room ? Array.from(room.players) : [];
	}


	/**
	 * Check if a player is in a specific room
	 */
	isPlayerInRoom(roomId: string, playerId: number): boolean {
		const room = this.rooms.get(roomId);
		return room ? room.players.has(playerId) : false;
	}

	/**
	 * Find which room a player is in (returns first match)
	 */
	findPlayerRoom(playerId: number): string | null {
		for (const [roomId, room] of this.rooms.entries()) {
			if (room.players.has(playerId)) {
				return roomId;
			}
		}
		return null;
	}

	/**
	 * Get player count for a specific room
	 */
	getPlayerCount(roomId: string): number {
		const room = this.rooms.get(roomId);
		return room ? room.players.size : 0;
	}

	/**
	 * Remove a player from all rooms (useful for cleanup when player disconnects)
	 */
	removePlayerFromAllRooms(playerId: number): string[] {
		const roomsLeft: string[] = [];
		
		for (const [roomId, room] of this.rooms.entries()) {
			if (room.players.has(playerId)) {
				room.players.delete(playerId);
				room.userCount = Math.max(0, room.userCount - 1);
				room.lastActivity = new Date();
				roomsLeft.push(roomId);
				
				// Delete room if empty
				if (room.userCount === 0) {
					// Cleanup the RoomManager instance
					room.roomManager.destroy();
					this.rooms.delete(roomId);
					console.log(`Room ${roomId} deleted (empty after player ${playerId} removed)`);
				}
			}
		}
		
		return roomsLeft;
	}

	/**
	 * Start a game in a room - ServerManager delegates to room's RoomManager
	 */
	async startGame(roomId: string, initiatorPlayerId: number): Promise<any> {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}

		if (!room.players.has(initiatorPlayerId)) {
			throw new Error(`Player ${initiatorPlayerId} is not in room ${roomId}`);
		}

		if (room.players.size < 2) {
			throw new Error('Need at least 2 players to start game');
		}

		// RoomManager already has the player objects, just call startGame
		const gameResult = await room.roomManager.startGame();
		
		// Update room activity
		this.updateActivity(roomId);
		
		console.log(`Game started in room ${roomId} by player ${initiatorPlayerId}`);
		return gameResult;
	}

	/**
	 * End a game in a room - ServerManager delegates to RoomManager
	 */
	async endGame(roomId: string, initiatorPlayerId?: number): Promise<any> {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}

		if (initiatorPlayerId && !room.players.has(initiatorPlayerId)) {
			throw new Error(`Player ${initiatorPlayerId} is not in room ${roomId}`);
		}

		// Delegate to room's RoomManager for game ending and persistence
		const gameResult = await room.roomManager.endGame();
		const persistResult = await room.roomManager.persistGameResults();
		
		// Update room activity
		this.updateActivity(roomId);
		// Delete room manager?
		this.deleteRoom(roomId);
		
		console.log(`Game ended in room ${roomId} - Winner: ${gameResult.winner}`);
		
		return {
			...gameResult,
			persistenceResult: persistResult
		};
	}

	/**
	 * Get game state for a room
	 */
	async getGameState(roomId: string): Promise<any> {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}

		return await room.roomManager.getGameState();
	}

	/**
	 * Reset game in a room
	 */
	async resetGame(roomId: string, initiatorPlayerId: number): Promise<any> {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}

		if (!room.players.has(initiatorPlayerId)) {
			throw new Error(`Player ${initiatorPlayerId} is not in room ${roomId}`);
		}

		// Delegate to room's RoomManager instance
		const gameResult = await room.roomManager.resetGame();
		
		// Update room activity
		this.updateActivity(roomId);
		
		console.log(`Game reset in room ${roomId} by player ${initiatorPlayerId}`);
		return gameResult;
	}

	/**
	 * Handle sequence save from IO - delegates to RoomManager
	 */
	async saveSequence(roomId: string, playerId: number, sequence: string[]) {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}

		if (!room.players.has(playerId)) {
			throw new Error(`Player ${playerId} is not in room ${roomId}`);
		}

		// Update room activity
		this.updateActivity(roomId);

		// Delegate to room's RoomManager
		return await room.roomManager.saveSequence(playerId, sequence);
	}

	/**
	 * Handle round result from IO - delegates to RoomManager
	 */
	async updateRoundResult(roomId: string, playerId: number, pointsEarned: number) {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} does not exist`);
		}

		if (!room.players.has(playerId)) {
			throw new Error(`Player ${playerId} is not in room ${roomId}`);
		}

		// Update room activity
		this.updateActivity(roomId);

		// Delegate to room's RoomManager
		const result = await room.roomManager.updateRoundResult(playerId, pointsEarned);

		// If game ended, automatically persist results
		if (result.gameEnded) {
			const persistResult = await room.roomManager.persistGameResults();
			console.log(`🏆 Game completed in room ${roomId}, persistence result:`, persistResult.success);
			
			return {
				...result,
				persistenceResult: persistResult
			};
		}

		return result;
	}


	addOnlineUser(username: string): void {
		this.onlineUsers.add(username);
	}

	removeOnlineUser(username: string): void {
		this.onlineUsers.delete(username);
	}

	/**
	 * Get room statistics
	 */
	getStats(): {
		totalRooms: number;
		activeRooms: number;
		totalUsers: number;
		onlineUsers: Set<string>;
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
			onlineUsers: this.onlineUsers,
			emptyRooms: emptyRooms.length,
		};
	}

	/**
	 * Delete a specific room
	 */
	deleteRoom(roomId: string): boolean {
		const room = this.rooms.get(roomId);
		if (room) {
			// Cleanup the RoomManager instance
			room.roomManager.destroy();
		}
		
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
			const room = this.rooms.get(roomId);
			if (room) {
				// Cleanup the RoomManager instance
				room.roomManager.destroy();
			}
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
	 * Shutdown the server manager and stop cleanup job
	 */
	shutdown(): void {
		cron.getTasks().forEach(task => task.stop());
		
		// Cleanup all RoomManager instances
		for (const room of this.rooms.values()) {
			room.roomManager.destroy();
		}
		
		this.rooms.clear();
		console.log('Server manager shutdown complete');
	}
}
