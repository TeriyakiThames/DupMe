import { SocketWithUser } from '../../types/socket';
import { ServerManager } from '../../managers/serverManager';

/**
 * Handle new socket connection
 */
export function handleConnection(socket: SocketWithUser, serverManager: ServerManager): void {
	// Handle ping/pong for connection health
	socket.on('ping', () => {
		socket.emit('pong', { timestamp: Date.now() });
	});

	// Send welcome message
	socket.emit('connected', {
		message: 'Welcome to DupMe!',
		serverTime: new Date().toISOString(),
		socketId: socket.id
	});

	// Handle get-stats event (only for authenticated users)
	socket.on('get-stats', () => {
		if (!socket.userProfile) {
			socket.emit('error', { message: 'Authentication required to get server stats.' });
			return;
		}
		const stats = serverManager.getStats();
		socket.emit('server-stats', stats);
	});
}