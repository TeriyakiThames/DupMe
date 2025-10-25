import { Server as SocketIOServer } from 'socket.io';
import { SessionSocket } from '../../types/socket';
import { ServerManager } from '../../managers/serverManager';
import { UserProfile } from '../../types/auth';

/**
 * Handle socket disconnection and cleanup
 */
export function handleDisconnection(
	socket: SessionSocket, 
	serverManager: ServerManager, 
	io: SocketIOServer,
	userProfile?: UserProfile
): void {
	try {
		// Remove user from all rooms they were in
		if (userProfile) {
			const roomsLeft = serverManager.removePlayerFromAllRooms(userProfile.id);
			
			if (roomsLeft.length > 0) {
				console.log(`🏃 Player ${userProfile.username} (${userProfile.id}) removed from rooms: ${roomsLeft.join(', ')}`);
				
				// Notify remaining players in each room
				roomsLeft.forEach(roomId => {
					if (serverManager.roomExists(roomId)) {
						// Get remaining players in room
						const remainingPlayers = serverManager.getPlayersInRoom(roomId);
						
					// Notify remaining players
					io.to(roomId).emit('player-left', {
						playerId: userProfile.id,
						username: userProfile.username,
						roomId,
						remainingPlayers: remainingPlayers.length,
						message: `${userProfile.username} has left the room`
					});						// If room becomes empty, it's automatically deleted by ServerManager
						if (remainingPlayers.length === 0) {
							console.log(`🗑️ Room ${roomId} will be deleted (empty after disconnect)`);
						}
					}
				});
			}
		}

		const session = socket.request.session;
		
		// Leave all socket.io rooms
		if (session.currentRoomId) {
			socket.leave(session.currentRoomId);
		}

		serverManager.removeOnlineUser(session.userProfile?.username as string);
		console.log(`👋 Socket ${socket.id} cleanup completed`);

	} catch (error) {
		console.error(`Error during disconnect cleanup for socket ${socket.id}:`, error);
	}
}