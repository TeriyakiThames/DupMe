import { Server as SocketIOServer } from 'socket.io';
import { ServerManager } from '../managers/serverManager';
import { handleConnection } from './events/connection';
import { handleDisconnection } from './events/disconnect';
import { setupRoomEvents } from './events/room';
import { setupGameEvents } from './events/game';
import { SocketWithUser } from '../types/socket';

export class SocketIOService {
	private io: SocketIOServer;
	private serverManager: ServerManager;

	constructor(io: SocketIOServer, serverManager: ServerManager) {
		this.io = io;
		this.serverManager = serverManager;
		this.setupEventHandlers();
		console.log('🔌 Socket.IO service initialized');
	}

	private setupEventHandlers(): void {
		this.io.on('connection', (socket: SocketWithUser) => {
			console.log(`🔗 Client connected: ${socket.id}`);

			// Handle initial connection
			handleConnection(socket, this.serverManager);

			// Setup room events
			setupRoomEvents(socket, this.serverManager, this.io);

			// Setup game events
			setupGameEvents(socket, this.serverManager, this.io);

			// Handle disconnection
			socket.on('disconnect', (reason) => {
				console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
				// Pass userProfile if available
				handleDisconnection(socket, this.serverManager, this.io, socket.userProfile);
			});

			// Handle errors
			socket.on('error', (error) => {
				console.error(`❌ Socket error for ${socket.id}:`, error);
			});
		});
	}

	/**
	 * Broadcast message to all clients in a room
	 */
	broadcastToRoom(roomId: string, event: string, data: any): void {
		this.io.to(roomId).emit(event, data);
	}

	/**
	 * Send message to specific socket
	 */
	sendToSocket(socketId: string, event: string, data: any): void {
		this.io.to(socketId).emit(event, data);
	}

	/**
	 * Get all sockets in a room
	 */
	async getSocketsInRoom(roomId: string): Promise<Set<string>> {
		const room = this.io.sockets.adapter.rooms.get(roomId);
		return room || new Set();
	}

	/**
	 * Get socket count for a room
	 */
	async getRoomSocketCount(roomId: string): Promise<number> {
		const sockets = await this.getSocketsInRoom(roomId);
		return sockets.size;
	}
}