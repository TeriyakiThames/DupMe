import { Server } from "socket.io";
import { RoomManager } from "./roomService";
import { UserService } from "./userService";

export class SocketService {
  private io: Server;
  private roomManager: RoomManager;
  private authenticatedPlayers: Map<string, { userId: number; username: string; socketId: string }> = new Map();

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.initializeSocketHandlers();
  }

  private initializeSocketHandlers(): void {
    this.io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);
      
      // Track which rooms this socket is in for cleanup on disconnect
      const socketRooms = new Set<string>();
      let playerId: string;

      socket.on("player-connected", async (data: { playerId: string }, callback?: (success: boolean, message?: string) => void) => {
        try {
          // Validate playerId is a valid user ID
          const userIdNum = parseInt(data.playerId);
          if (isNaN(userIdNum)) {
            callback?.(false, "Invalid player ID format. Must be a valid user ID.");
            return;
          }

          // Verify user exists in database
          const userResult = await UserService.getUserById(userIdNum);
          if (!userResult.success || !userResult.user) {
            callback?.(false, "User not found. Please register or login first.");
            return;
          }

          // Store authenticated player data
          playerId = data.playerId;
          this.authenticatedPlayers.set(playerId, {
            userId: userResult.user.id,
            username: userResult.user.username,
            socketId: socket.id
          });

          console.log(`Player ${userResult.user.username} (ID: ${playerId}) connected with socket ${socket.id}`);
          callback?.(true, `Welcome ${userResult.user.username}! Connected successfully.`);
        } catch (error) {
          console.error('Player connection error:', error);
          callback?.(false, "Authentication failed. Please try again.");
        }
      });

      socket.on("disconnect", () => {
        if (playerId) {
          const playerData = this.authenticatedPlayers.get(playerId);
          const username = playerData?.username || `Player ${playerId}`;
          
          console.log(`${username} disconnected (ID: ${playerId})`);
          
          // Leave all rooms and update room manager
          socketRooms.forEach(roomId => {
            this.roomManager.leaveRoom(roomId, playerId);
            socket.leave(roomId);
            console.log(`${username} left room ${roomId} (disconnect)`);
          });
          
          // Clean up authenticated player data
          this.authenticatedPlayers.delete(playerId);
        } else {
          console.log("Socket disconnected before player identification:", socket.id);
        }
        
        socketRooms.clear();
      });

      socket.on("join-room", (roomId: string, callback?: (success: boolean, message?: string) => void) => {
        if (!playerId) {
          callback?.(false, "Player not identified. Send player-connected event first.");
          return;
        }
        this.handleJoinRoom(socket, roomId, playerId, socketRooms, callback);
      });

      socket.on("leave-room", (roomId: string, callback?: (success: boolean, message?: string) => void) => {
        if (!playerId) {
          callback?.(false, "Player not identified. Send player-connected event first.");
          return;
        }
        this.handleLeaveRoom(socket, roomId, playerId, socketRooms, callback);
      });

      socket.on("send-message", (data: { roomId: string; message: string }, callback?: (success: boolean, message?: string) => void) => {
        if (!playerId) {
          callback?.(false, "Player not identified. Send player-connected event first.");
          return;
        }
        this.handleSendMessage(socket, data, playerId, socketRooms, callback);
      });

      socket.on("get-room-info", (roomId: string, callback?: (roomInfo: any) => void) => {
        this.handleGetRoomInfo(roomId, callback);
      });

      socket.on("start-game", (data: { roomId: string }, callback?: (success: boolean, result?: any) => void) => {
        if (!playerId) {
          callback?.(false, { error: "Player not identified. Send player-connected event first." });
          return;
        }
        this.handleStartGame(socket, data, playerId, socketRooms, callback);
      });

      socket.on("end-game", (data: { roomId: string; scores: Record<string, number>; winner: string }, callback?: (success: boolean) => void) => {
        if (!playerId) {
          callback?.(false);
          return;
        }
        this.handleEndGame(socket, data, playerId, socketRooms, callback);
      });

      socket.on("reset-game", (data: { roomId: string }, callback?: (success: boolean, result?: any) => void) => {
        if (!playerId) {
          callback?.(false, { error: "Player not identified. Send player-connected event first." });
          return;
        }
        this.handleResetGame(socket, data, playerId, socketRooms, callback);
      });

      socket.on("get-game-state", (data: { roomId: string }, callback?: (success: boolean, gameState?: any) => void) => {
        if (!playerId) {
          callback?.(false, { error: "Player not identified. Send player-connected event first." });
          return;
        }
        this.handleGetGameState(data.roomId, playerId, socketRooms, callback);
      });

      
    });
  }

  private getAuthenticatedPlayer(playerId: string): { userId: number; username: string; socketId: string } | null {
    return this.authenticatedPlayers.get(playerId) || null;
  }

  private handleJoinRoom(
    socket: any,
    roomId: string,
    playerId: string,
    socketRooms: Set<string>,
    callback?: (success: boolean, message?: string) => void
  ): void {
    // Validate room exists
    if (!this.roomManager.roomExists(roomId)) {
      const errorMsg = `Room ${roomId} does not exist`;
      console.log(`Failed to join room: ${errorMsg}`);
      callback?.(false, errorMsg);
      return;
    }

    // Try to join room through room manager
    const success = this.roomManager.joinRoom(roomId, playerId);
    if (!success) {
      const room = this.roomManager.getRoomById(roomId);
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
    
    const room = this.roomManager.getRoomById(roomId);
    const playerData = this.getAuthenticatedPlayer(playerId);
    const username = playerData?.username || `Player ${playerId}`;
    
    console.log(`${username} joined room ${roomId} (${room?.userCount} users)`);
    
    // Notify others in the room
    socket.to(roomId).emit("user-joined", { 
      playerId: playerId,
      username: username,
      userCount: room?.userCount,
      timestamp: new Date()
    });
    
    callback?.(true, `Successfully joined room ${roomId}`);
  }

  private handleLeaveRoom(
    socket: any,
    roomId: string,
    playerId: string,
    socketRooms: Set<string>,
    callback?: (success: boolean, message?: string) => void
  ): void {
    if (!socketRooms.has(roomId)) {
      const errorMsg = `Player ${playerId} is not in room ${roomId}`;
      console.log(errorMsg);
      callback?.(false, errorMsg);
      return;
    }

    const success = this.roomManager.leaveRoom(roomId, playerId);
    if (success) {
      socket.leave(roomId);
      socketRooms.delete(roomId);
      
      const room = this.roomManager.getRoomById(roomId);
      const playerData = this.getAuthenticatedPlayer(playerId);
      const username = playerData?.username || `Player ${playerId}`;
      
      if (room) {
        console.log(`${username} left room ${roomId} (${room.userCount} users remaining)`);
        
        // Notify others in the room
        socket.to(roomId).emit("user-left", { 
          playerId: playerId,
          username: username,
          userCount: room.userCount,
          timestamp: new Date()
        });
      } else {
        console.log(`${username} left room ${roomId} (room deleted - was empty)`);
      }
      
      callback?.(true, `Successfully left room ${roomId}`);
    } else {
      callback?.(false, `Failed to leave room ${roomId}`);
    }
  }

  private handleSendMessage(
    socket: any,
    data: { roomId: string; message: string },
    playerId: string,
    socketRooms: Set<string>,
    callback?: (success: boolean, message?: string) => void
  ): void {
    const { roomId, message } = data;
    
    // Validate user is in the room
    if (!socketRooms.has(roomId)) {
      const errorMsg = `Player ${playerId} is not in room ${roomId}`;
      callback?.(false, errorMsg);
      return;
    }

    // Validate room exists
    if (!this.roomManager.roomExists(roomId)) {
      const errorMsg = `Room ${roomId} no longer exists`;
      callback?.(false, errorMsg);
      return;
    }

    // Update room activity
    this.roomManager.updateActivity(roomId);
    
    const playerData = this.getAuthenticatedPlayer(playerId);
    const username = playerData?.username || `Player ${playerId}`;
    
    // Broadcast message to room
    this.io.to(roomId).emit("receive-message", {
      playerId: playerId,
      username: username,
      message,
      timestamp: new Date(),
      roomId
    });
    
    console.log(`Message sent to room ${roomId} by ${username}`);
    callback?.(true, "Message sent successfully");
  }

  private handleGetRoomInfo(
    roomId: string,
    callback?: (roomInfo: any) => void
  ): void {
    const room = this.roomManager.getRoomById(roomId);
    if (room) {
      const playersInRoom = this.roomManager.getPlayersInRoom(roomId);
      callback?.({
        id: room.id,
        userCount: room.userCount,
        maxUsers: room.maxUsers,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        metadata: room.metadata,
        players: playersInRoom
      });
    } else {
      callback?.(null);
    }
  }

  private async handleStartGame(
    socket: any,
    data: { roomId: string },
    playerId: string,
    socketRooms: Set<string>,
    callback?: (success: boolean, result?: any) => void
  ): Promise<void> {
    const { roomId } = data;
    
    // Validate user is in the room
    if (!socketRooms.has(roomId)) {
      const errorMsg = `Player ${playerId} is not in room ${roomId}`;
      callback?.(false, { error: errorMsg });
      return;
    }

    try {
      // Call RoomManager to start the game (it will orchestrate with GameService)
      const gameResult = await this.roomManager.startGame(roomId, playerId);
      
      // Notify all players in the room that the game has started
      this.io.to(roomId).emit("game-started", {
        roomId,
        firstPlayer: gameResult.firstPlayer,
        players: gameResult.players,
        timestamp: new Date()
      });
      
      console.log(`Game started in room ${roomId} by player ${playerId}`);
      callback?.(true, gameResult);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start game';
      console.error(`Failed to start game in room ${roomId}:`, errorMsg);
      callback?.(false, { error: errorMsg });
    }
  }

  private async handleEndGame(
    socket: any,
    data: { roomId: string; scores: Record<string, number>; winner: string },
    playerId: string,
    socketRooms: Set<string>,
    callback?: (success: boolean) => void
  ): Promise<void> {
    const { roomId, scores, winner } = data;
    
    // Validate user is in the room
    if (!socketRooms.has(roomId)) {
      console.log(`Player ${playerId} is not in room ${roomId}`);
      callback?.(false);
      return;
    }

    try {
      // Call RoomManager to end the game (it will orchestrate with GameService)
      const gameResult = await this.roomManager.endGame(roomId, scores, winner, playerId);
      
      // Notify all players in the room that the game has ended
      this.io.to(roomId).emit("game-ended", {
        roomId,
        winner,
        leaderboard: gameResult.leaderboard,
        timestamp: new Date()
      });
      
      console.log(`Game ended in room ${roomId} - Winner: ${winner}`);
      callback?.(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to end game';
      console.error(`Failed to end game in room ${roomId}:`, errorMsg);
      callback?.(false);
    }
  }

  private async handleResetGame(
    socket: any,
    data: { roomId: string },
    playerId: string,
    socketRooms: Set<string>,
    callback?: (success: boolean, result?: any) => void
  ): Promise<void> {
    const { roomId } = data;
    
    // Validate user is in the room
    if (!socketRooms.has(roomId)) {
      const errorMsg = `Player ${playerId} is not in room ${roomId}`;
      callback?.(false, { error: errorMsg });
      return;
    }

    try {
      // Call RoomManager to reset the game
      const gameResult = await this.roomManager.resetGame(roomId, playerId);
      
      // Notify all players in the room that the game has been reset
      this.io.to(roomId).emit("game-reset", {
        roomId,
        timestamp: new Date()
      });
      
      console.log(`Game reset in room ${roomId} by player ${playerId}`);
      callback?.(true, gameResult);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reset game';
      console.error(`Failed to reset game in room ${roomId}:`, errorMsg);
      callback?.(false, { error: errorMsg });
    }
  }

  private async handleGetGameState(
    roomId: string,
    playerId: string,
    socketRooms: Set<string>,
    callback?: (success: boolean, gameState?: any) => void
  ): Promise<void> {
    // Validate user is in the room
    if (!socketRooms.has(roomId)) {
      const errorMsg = `Player ${playerId} is not in room ${roomId}`;
      callback?.(false, { error: errorMsg });
      return;
    }

    try {
      // Call RoomManager to get game state
      const gameState = await this.roomManager.getGameState(roomId);
      
      console.log(`Game state requested for room ${roomId} by player ${playerId}`);
      callback?.(true, gameState);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get game state';
      console.error(`Failed to get game state for room ${roomId}:`, errorMsg);
      callback?.(false, { error: errorMsg });
    }
  }
}