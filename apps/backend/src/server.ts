import express from "express";
import http from "http";
import { Server } from "socket.io";
import { RoomManager } from "./RoomManager";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json" assert { type: "json" };

// Initialize room manager with custom options
const roomManager = new RoomManager({
	cleanupInterval: '*/2 * * * *', // Every 2 minutes for more frequent cleanup
	maxInactiveTime: 60, // 60 minutes before inactive rooms are deleted
	maxRooms: 500, // Maximum 500 concurrent rooms
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (_, res) => {
	res.send("Hello from Express + Socket.IO backend!");
});

// Create a new room
app.post("/room", (_, res) => {
	try {
		const roomId = roomManager.createRoom();
		res.json({ 
			success: true, 
			roomId,
			message: `Room ${roomId} created successfully` 
		});
	} catch (error) {
		res.status(500).json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Failed to create room' 
		});
	}
});

// Get room information
app.get("/room/:roomId", (req, res) => {
	const { roomId } = req.params;
	const room = roomManager.getRoomById(roomId);
	
	if (!room) {
		return res.status(404).json({ 
			success: false, 
			error: 'Room not found' 
		});
	}

	res.json({ 
		success: true, 
		room: {
			id: room.id,
			userCount: room.userCount,
			maxUsers: room.maxUsers,
			createdAt: room.createdAt,
			lastActivity: room.lastActivity,
			metadata: room.metadata
		}
	});
});

// Get room statistics
app.get("/rooms/stats", (_, res) => {
	const stats = roomManager.getStats();
	res.json({ success: true, stats });
});

// List all rooms (for debugging/admin purposes)
app.get("/rooms", (_, res) => {
	const rooms = roomManager.getAllRooms().map(room => ({
		id: room.id,
		userCount: room.userCount,
		maxUsers: room.maxUsers,
		createdAt: room.createdAt,
		lastActivity: room.lastActivity
	}));
	
	res.json({ success: true, rooms, count: rooms.length });
});

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);
	
	// Track which rooms this socket is in for cleanup on disconnect
	const socketRooms = new Set<string>();

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
		
		// Leave all rooms and update room manager
		socketRooms.forEach(roomId => {
			roomManager.leaveRoom(roomId);
			socket.leave(roomId);
			console.log(`User ${socket.id} left room ${roomId} (disconnect)`);
		});
		
		socketRooms.clear();
	});

	socket.on("join-room", (roomId: string, callback?: (success: boolean, message?: string) => void) => {
		// Validate room exists
		if (!roomManager.roomExists(roomId)) {
			const errorMsg = `Room ${roomId} does not exist`;
			console.log(`Failed to join room: ${errorMsg}`);
			callback?.(false, errorMsg);
			return;
		}

		// Try to join room through room manager
		const success = roomManager.joinRoom(roomId);
		if (!success) {
			const room = roomManager.getRoomById(roomId);
			const errorMsg = room && room.maxUsers && room.userCount >= room.maxUsers 
				? `Room ${roomId} is at capacity (${room.maxUsers} users)`
				: `Failed to join room ${roomId}`;
			console.log(`Failed to join room: ${errorMsg}`);
			callback?.(false, errorMsg);
			return;
		}

		// Join the socket.io room
		socket.join(roomId);
		socketRooms.add(roomId);
		
		const room = roomManager.getRoomById(roomId);
		console.log(`User ${socket.id} joined room ${roomId} (${room?.userCount} users)`);
		
		// Notify others in the room
		socket.to(roomId).emit("user-joined", { 
			userId: socket.id, 
			userCount: room?.userCount,
			timestamp: new Date()
		});
		
		callback?.(true, `Successfully joined room ${roomId}`);
	});

	socket.on("leave-room", (roomId: string, callback?: (success: boolean, message?: string) => void) => {
		if (!socketRooms.has(roomId)) {
			const errorMsg = `User ${socket.id} is not in room ${roomId}`;
			console.log(errorMsg);
			callback?.(false, errorMsg);
			return;
		}

		const success = roomManager.leaveRoom(roomId);
		if (success) {
			socket.leave(roomId);
			socketRooms.delete(roomId);
			
			const room = roomManager.getRoomById(roomId);
			if (room) {
				console.log(`User ${socket.id} left room ${roomId} (${room.userCount} users remaining)`);
				
				// Notify others in the room
				socket.to(roomId).emit("user-left", { 
					userId: socket.id, 
					userCount: room.userCount,
					timestamp: new Date()
				});
			} else {
				console.log(`User ${socket.id} left room ${roomId} (room deleted - was empty)`);
			}
			
			callback?.(true, `Successfully left room ${roomId}`);
		} else {
			callback?.(false, `Failed to leave room ${roomId}`);
		}
	});

	socket.on("send-message", (data: { roomId: string; message: string }, callback?: (success: boolean, message?: string) => void) => {
		const { roomId, message } = data;
		
		// Validate user is in the room
		if (!socketRooms.has(roomId)) {
			const errorMsg = `User ${socket.id} is not in room ${roomId}`;
			callback?.(false, errorMsg);
			return;
		}

		// Validate room exists
		if (!roomManager.roomExists(roomId)) {
			const errorMsg = `Room ${roomId} no longer exists`;
			callback?.(false, errorMsg);
			return;
		}

		// Update room activity
		roomManager.updateActivity(roomId);
		
		// Broadcast message to room
		io.to(roomId).emit("receive-message", {
			userId: socket.id,
			message,
			timestamp: new Date(),
			roomId
		});
		
		console.log(`Message sent to room ${roomId} by ${socket.id}`);
		callback?.(true, "Message sent successfully");
	});

	// Handle room-specific events
	socket.on("get-room-info", (roomId: string, callback?: (roomInfo: any) => void) => {
		const room = roomManager.getRoomById(roomId);
		if (room) {
			callback?.({
				id: room.id,
				userCount: room.userCount,
				maxUsers: room.maxUsers,
				createdAt: room.createdAt,
				lastActivity: room.lastActivity,
				metadata: room.metadata
			});
		} else {
			callback?.(null);
		}
	});
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGINT', () => {
	console.log('\n🛑 Shutting down server...');
	roomManager.shutdown();
	server.close(() => {
		console.log('✅ Server shutdown complete');
		process.exit(0);
	});
});

process.on('SIGTERM', () => {
	console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
	roomManager.shutdown();
	server.close(() => {
		console.log('✅ Server shutdown complete');
		process.exit(0);
	});
});
