import { Server as SocketIOServer, Socket } from 'socket.io';
import { ServerManager } from '../managers/serverManager';
import { handleConnection } from './events/connection';
import { handleDisconnection } from './events/disconnect';
import { setupRoomEvents } from './events/server';
import { setupGameEvents } from './events/room';
import { SessionSocket } from '../types/socket';
import { type Request } from "express";

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
		this.io.on('connection', (socket : Socket) => {
			console.log(`🔗 Client connected: ${socket.id}`);
			const sessionSocket = <SessionSocket> socket;
			
            const req = sessionSocket.request as Request;
			const userProfile = req.session.userProfile;
			if (userProfile) {
				// Handle initial connection
				handleConnection(sessionSocket, this.serverManager);

				// Setup room events
				setupRoomEvents(sessionSocket, this.serverManager, this.io);

				// Setup game events
				setupGameEvents(sessionSocket, this.serverManager, this.io);

				// Handle disconnection
				sessionSocket.on('disconnect', (reason) => {
					console.log(`🔌 Client disconnected: ${sessionSocket.id}, reason: ${reason}`);
					// Pass userProfile if available
					handleDisconnection(sessionSocket, this.serverManager, this.io, userProfile);
				});

				// Handle errors
				sessionSocket.on('error', (error) => {
					console.error(`❌ Socket error for ${sessionSocket.id}:`, error);
				});
			} else {
				console.warn(`⚠️ Socket ${sessionSocket.id} missing userProfile in handshake auth, disconnecting`);
				sessionSocket.emit('error', { message: 'Authentication required' });
				sessionSocket.disconnect();
			}
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