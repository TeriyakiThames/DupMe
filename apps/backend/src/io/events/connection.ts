import { ServerEventBroadcast, SocketWithUser } from '../../types/socket';
import { ServerManager } from '../../managers/serverManager';

/**
 * Handle new socket connection
 */
export function handleConnection(socket: SocketWithUser, serverManager: ServerManager): void {
	// Send welcome message
	socket.emit('connected', {
		message: 'Welcome to DupMe!',
		serverTime: new Date().toISOString(),
		socketId: socket.id
	});
	socket.emit('server-stats', serverManager.getStats() as ServerEventBroadcast);
}