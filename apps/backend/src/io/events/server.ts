import { Server as SocketIOServer } from 'socket.io';
import { SessionSocket, ServerEventBroadcast, ServerEventRequest, ServerEventResponse } from '../../types/socket';
import { ServerManager } from '../../managers/serverManager';
import { UserProfile } from '../../types/auth';

/**
 * Setup room-related socket events
 */
export function setupRoomEvents(
	socket: SessionSocket, 
	serverManager: ServerManager, 
	io: SocketIOServer
): void {

	/**
	 * Create a new room
	 */
	socket.on('create-room', async (data: ServerEventRequest) => {
		try {
			if (!data.userProfile) {
				socket.emit('error', { message: 'User profile is required' });
				return;
			}

			// Use UserProfile from session data
			const player: UserProfile = data.userProfile;

			// Create room with this player
			const roomId = serverManager.createRoom([player], data.maxUsers, data.metadata);
			
			// Join the socket.io room
			socket.join(roomId);
			socket.request.session.currentRoomId = roomId;

			console.log(`🏠 Room ${roomId} created by ${player.username}`);

			// Confirm room creation
			socket.emit('room-created', {
				success: true,
				roomId,
				message: `Room ${roomId} created successfully`,
				players: [player],
				maxUsers: data.maxUsers
			} as ServerEventResponse);

		} catch (error) {
			console.error('Error creating room:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to create room' 
			});
		}
	});

	/**
	 * Join an existing room
	 */
	socket.on('join-room', async (data: ServerEventRequest) => {
		try {
			if (!data.userProfile) {
				socket.emit('error', { message: 'User profile is required' });
				return;
			}

			if (!data.roomId) {
				socket.emit('error', { message: 'Room ID is required' });
				return;
			}

			// Check if room exists
			if (!serverManager.roomExists(data.roomId)) {
				socket.emit('error', { message: 'Room does not exist' });
				return;
			}

			// Try to join the room
			const joined = serverManager.joinRoom(data.roomId, data.userProfile);
			
			if (!joined) {
				socket.emit('error', { message: 'Failed to join room (room full or already joined)' });
				return;
			}

			// Join the socket.io room
			socket.join(data.roomId);
			socket.request.session.currentRoomId = data.roomId;

			// Get room info
			const room = serverManager.getRoomById(data.roomId);
			const playersInRoom = serverManager.getPlayersInRoom(data.roomId);

			console.log(`🚪 Player ${data.userProfile.username} joined room ${data.roomId}`);

			// Notify the joining player
			socket.emit('room-joined', {
				success: true,
				roomId: data.roomId,
				message: `Successfully joined room ${data.roomId}`,
				playerCount: playersInRoom.length,
				maxUsers: room?.maxUsers
			} as ServerEventResponse);

			// Notify other players in the room
			socket.to(data.roomId).emit('player-joined', {
				playerId: data.userProfile.id,
				username: data.userProfile.username,
				roomId: data.roomId,
				playerCount: playersInRoom.length,
				message: `${data.userProfile.username} has joined the room`
			} as ServerEventBroadcast);

		} catch (error) {
			console.error('Error joining room:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to join room' 
			});
		}
	});

	/**
	 * Leave current room
	 */
	socket.on('leave-room', async (data: ServerEventRequest) => {
		try {
			const session = socket.request.session;
			if (!data.userProfile || !session.currentRoomId) {
				socket.emit('error', { message: 'User profile required and must be in a room' });
				return;
			}

			const roomId = session.currentRoomId;
			const left = serverManager.leaveRoom(roomId, data.userProfile.id);

			if (left) {
				// Leave the socket.io room
				socket.leave(roomId);
				socket.request.session.currentRoomId = undefined;

				console.log(`🚪 Player ${data.userProfile.username} left room ${roomId}`);

				// Confirm to the leaving player
				socket.emit('room-left', {
					success: true,
					roomId,
					message: `Left room ${roomId} successfully`
				} as ServerEventResponse);

				// Notify remaining players (if room still exists)
				if (serverManager.roomExists(roomId)) {
					const remainingPlayers = serverManager.getPlayersInRoom(roomId);
					
					io.to(roomId).emit('player-left', {
						playerId: data.userProfile.id,
						username: data.userProfile.username,
						roomId,
						remainingPlayers: remainingPlayers.length,
						message: `${data.userProfile.username} has left the room`
					} as ServerEventBroadcast);
				}
			} else {
				socket.emit('error', { message: 'Failed to leave room' });
			}

		} catch (error) {
			console.error('Error leaving room:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to leave room' 
			});
		}
	});

	/**
	 * Get room information
	 */
	socket.on('get-room-info', async (data: ServerEventRequest) => {
		try {
			const session = socket.request.session;
			const roomId = data.roomId || session.currentRoomId;

			if (!roomId) {
				socket.emit('error', { message: 'No room ID provided or not in a room' });
				return;
			}

			if (!serverManager.roomExists(roomId)) {
				socket.emit('error', { message: 'Room does not exist' });
				return;
			}

			const room = serverManager.getRoomById(roomId);
			const players = serverManager.getPlayersInRoom(roomId);
			// const idUsernameMap = serverManager.getIdUsernameMap(roomId);

			socket.emit('room-info', {
				success: true,
				roomId,
			    playerCount: players.length,
				// idUsernameMap, 
				maxUsers: room?.maxUsers,
				createdAt: room?.createdAt,
				lastActivity: room?.lastActivity,
				metadata: room?.metadata,
			} as ServerEventResponse);

		} catch (error) {
			console.error('Error getting room info:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to get room info' 
			});
		}
	});


	socket.on('get-server-stats', async () => {
		try {
			const stats = serverManager.getStats();
			socket.emit('server-stats', stats as ServerEventResponse);
		} catch (error) {
			console.error('Error getting server stats:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to get server stats' 
			});
		}
	});
}