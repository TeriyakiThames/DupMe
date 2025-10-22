import { Server as SocketIOServer } from 'socket.io';
import { SocketWithUser } from '../../types/socket';
import { ServerManager } from '../../managers/serverManager';
import { UserProfile } from '../../types/auth';
import { RoomEventRequest, RoomEventBroadcast, RoomEventResponse } from '../../types/socketGame';

/**
 * Setup game-related socket events
 */
export function setupGameEvents(
	socket: SocketWithUser, 
	serverManager: ServerManager, 
	io: SocketIOServer
): void {

	/**
	 * Start a game in the current room
	 */
	socket.on('start-game', async (data: RoomEventRequest) => {
		try {
			if (!data.userProfile || !socket.currentRoomId) {
				socket.emit('error', { message: 'User profile required and must be in a room to start a game' });
				return;
			}

			// Start the game via ServerManager
			const gameResult = await serverManager.startGame(socket.currentRoomId, data.userProfile.id);

			console.log(`🎮 Game started in room ${socket.currentRoomId} by ${data.userProfile.username}`);

			// Notify all players in the room
			io.to(socket.currentRoomId).emit('game-started', {
				...gameResult,
				message: `Game started by ${data.userProfile.username}!`
			} as RoomEventBroadcast);

		} catch (error) {
			console.error('Error starting game:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to start game' 
			});
		}
	});

	/**
	 * Save a sequence (pattern) - called by question player
	 */
	socket.on('save-sequence', async (data: RoomEventRequest) => {
		try {
			if (!data.userProfile || !socket.currentRoomId) {
				socket.emit('error', { message: 'User profile required and must be in a room to save sequence' });
				return;
			}

			if (!data.sequence || !Array.isArray(data.sequence)) {
				socket.emit('error', { message: 'Valid sequence array is required' });
				return;
			}

			// Save sequence via ServerManager
			const result = await serverManager.saveSequence(
				socket.currentRoomId, 
				data.userProfile.id, 
				data.sequence
			);

			console.log(`💾 Sequence saved in room ${socket.currentRoomId} by ${data.userProfile.username}`);

			// Confirm to the sequence creator
			socket.emit('sequence-saved', {
				success: true,
				message: 'Sequence saved successfully',
				sequenceLength: data.sequence.length
			} as RoomEventResponse);

			// Send sequence to answer players
			if (result.answerPlayerIds) {
				// Find the answer players' sockets by checking all sockets in room
				const sockets = await io.in(socket.currentRoomId).fetchSockets();
				const answerSockets = sockets.filter((s: any) => {
					// Note: We'll need to store userProfile on socket for this to work
					// Or find another way to identify the answer players
					return s.id !== socket.id && result.answerPlayerIds?.includes(s.userProfile.id);
				});


				answerSockets.forEach((answerSocket: any) => {
					answerSocket.emit('sequence-received', {
						success: true,
						sequence: result.sequence,
						roundNumber: result.roundNumber,
						message: result.message
					} as RoomEventBroadcast);
				});
			}

		} catch (error) {
			console.error('Error saving sequence:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to save sequence' 
			});
		}
	});

	/**
	 * Submit round result - called by answer player after attempting sequence
	 */
	socket.on('submit-round-result', async (data: { userProfile: UserProfile; pointsEarned: number }) => {
		try {
			if (!data.userProfile || !socket.currentRoomId) {
				socket.emit('error', { message: 'User profile required and must be in a room to submit result' });
				return;
			}

			if (typeof data.pointsEarned !== 'number' ) {
				socket.emit('error', { message: 'Valid points and success status required' });
				return;
			}

			// Update round result via ServerManager
			const result = await serverManager.updateRoundResult(
				socket.currentRoomId,
				data.userProfile.id,
				data.pointsEarned
			);

			console.log(`🎯 Round result submitted in room ${socket.currentRoomId} by ${data.userProfile.username}: ${data.pointsEarned} points`);

			if (result.gameEnded) {
				// Game has ended - notify all players
				io.to(socket.currentRoomId).emit('game-ended', {
					...result,
					message: 'Game completed!'
				} as RoomEventBroadcast);
				
				console.log(`🏁 Game ended in room ${socket.currentRoomId}`);
			} else {
				// Round continues - notify all players
				io.to(socket.currentRoomId).emit('round-updated', {
					...result,
					message: 'Roles switched!'
				} as RoomEventBroadcast);
			}

		} catch (error) {
			console.error('Error submitting round result:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to submit round result' 
			});
		}
	});

	/**
	 * End the current game
	 */
	socket.on('end-game', async (data: RoomEventRequest) => {
		try {
			if (!data.userProfile || !socket.currentRoomId) {
				socket.emit('error', { message: 'User profile required and must be in a room to end game' });
				return;
			}

			// End the game via ServerManager
			const gameResult = await serverManager.endGame(socket.currentRoomId, data.userProfile.id);

			console.log(`🏁 Game ended in room ${socket.currentRoomId} by ${data.userProfile.username}`);

			// Notify all players in the room
			io.to(socket.currentRoomId).emit('game-ended', {
				...gameResult,
				message: `Game ended by ${data.userProfile.username}`
			} as RoomEventBroadcast);

		} catch (error) {
			console.error('Error ending game:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to end game' 
			});
		}
	});

	/**
	 * Reset the current game
	 */
	socket.on('reset-game', async (data: { userProfile: UserProfile }) => {
		try {
			if (!data.userProfile || !socket.currentRoomId) {
				socket.emit('error', { message: 'User profile required and must be in a room to reset game' });
				return;
			}

			// Reset the game via ServerManager
			const gameResult = await serverManager.resetGame(socket.currentRoomId, data.userProfile.id);

			console.log(`🔄 Game reset in room ${socket.currentRoomId} by ${data.userProfile.username}`);

			// Notify all players in the room
			io.to(socket.currentRoomId).emit('game-reset', {
				...gameResult,
				message: `Game reset by ${data.userProfile.username}!`
			} as RoomEventBroadcast);

		} catch (error) {
			console.error('Error resetting game:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to reset game' 
			});
		}
	});

	/**
	 * Get current game state
	 */
	socket.on('get-game-state', async (data: { userProfile: UserProfile }) => {
		try {
			if (!data.userProfile || !socket.currentRoomId) {
				socket.emit('error', { message: 'User profile required and must be in a room to get game state' });
				return;
			}

			// Get game state via ServerManager
			const gameState = await serverManager.getGameState(socket.currentRoomId);

			socket.emit('game-state', {
				success: true,
				gameState,
				message: 'Game state retrieved successfully'
			} as RoomEventResponse);

		} catch (error) {
			console.error('Error getting game state:', error);
			socket.emit('error', { 
				message: error instanceof Error ? error.message : 'Failed to get game state' 
			});
		}
	});
}