import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

interface SocketManagerConfig {
  serverUrl?: string;
  autoConnect?: boolean;
  cookieName?: string;
}

interface AuthenticatedUser {
  id: number;
  username: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}

interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SocketManager {
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private currentUser: AuthenticatedUser | null = null;
  private isPlayerConnected: boolean = false;
  private connectionPromise: Promise<boolean> | null = null;
  private config: Required<SocketManagerConfig>;

  constructor(config: SocketManagerConfig = {}) {
    this.config = {
      serverUrl: config.serverUrl || 'http://localhost:3001',
      autoConnect: config.autoConnect ?? true,
      cookieName: config.cookieName || 'playerId'
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the socket server with a specific player ID
   */
  async connect(playerId?: string): Promise<boolean> {
    if (playerId) {
      this.playerId = playerId;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnection();
    return this.connectionPromise;
  }

  private async performConnection(): Promise<boolean> {
    try {
      if (!this.playerId) {
        throw new Error('Player ID is required for connection');
      }

      // Create socket connection
      this.socket = io(this.config.serverUrl, {
        autoConnect: false,
        transports: ['websocket', 'polling']
      });

      // Set up connection handlers
      this.setupConnectionHandlers();

      // Connect to server
      this.socket.connect();

      // Wait for connection and player authentication
      const connected = await this.waitForConnection();
      
      if (connected) {
        const authenticated = await this.authenticatePlayer();
        this.isPlayerConnected = authenticated;
        return authenticated;
      }

      return false;
    } catch (error) {
      console.error('Socket connection failed:', error);
      this.connectionPromise = null;
      return false;
    }
  }

  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.isPlayerConnected = false;
      this.connectionPromise = null;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.connectionPromise = null;
    });
  }

  private waitForConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(false);
        return;
      }

      if (this.socket.connected) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000); // 5 second timeout

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        resolve(true);
      });

      this.socket.once('connect_error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  private authenticatePlayer(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.playerId) {
        resolve(false);
        return;
      }

      this.socket.emit('player-connected', { playerId: this.playerId }, (success: boolean, message?: string) => {
        if (success) {
          console.log('✅ Player authenticated:', this.playerId);
          resolve(true);
        } else {
          console.error('❌ Player authentication failed:', message);
          resolve(false);
        }
      });
    });
  }

  /**
   * Set player ID (required before connecting)
   */
  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  /**
   * Set authenticated user data (automatically sets player ID from user.id)
   */
  setUser(user: AuthenticatedUser): void {
    this.currentUser = user;
    this.playerId = user.id.toString();
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUser;
  }

  /**
   * Ensure player is connected before executing socket operations
   */
  private async ensureConnected(): Promise<boolean> {
    if (this.isPlayerConnected && this.socket?.connected) {
      return true;
    }

    if (!this.playerId) {
      throw new Error('Player ID must be set before socket operations');
    }

    return await this.connect();
  }

  // ===========================================
  // ROOM OPERATIONS
  // ===========================================

  async joinRoom(roomId: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('join-room', roomId, (success: boolean, message?: string) => {
        resolve({
          success,
          data: success ? { roomId, message } : undefined,
          error: success ? undefined : message
        });
      });
    });
  }

  async leaveRoom(roomId: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('leave-room', roomId, (success: boolean, message?: string) => {
        resolve({
          success,
          data: success ? { roomId, message } : undefined,
          error: success ? undefined : message
        });
      });
    });
  }

  async getRoomInfo(roomId: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('get-room-info', roomId, (roomInfo: any) => {
        resolve({
          success: !!roomInfo,
          data: roomInfo,
          error: roomInfo ? undefined : 'Room not found'
        });
      });
    });
  }

  // ===========================================
  // GAME SERVICE OPERATIONS (matching backend)
  // ===========================================

  async startTurn(turnId: string, role: "creator" | "follower"): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('start-turn', { turnId, role }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to start turn'
        });
      });
    });
  }

  async savePattern(roomId: string, turnId: string, seq: string[]): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('save-pattern', { roomId, turnId, seq }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to save pattern'
        });
      });
    });
  }

  async checkPattern(roomId: string, turnId: string, key: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('check-pattern', { roomId, turnId, key }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to check pattern'
        });
      });
    });
  }

  async saveMatchResult(roomId: string, p1: string, p2: string, p1Score: number, p2Score: number, winner: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('save-match-result', { roomId, p1, p2, p1Score, p2Score, winner }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to save match result'
        });
      });
    });
  }

  async increasePoint(userName: string, points: number): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('increase-point', { userName, points }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to increase points'
        });
      });
    });
  }

  async decreasePoint(userName: string, points: number): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('decrease-point', { userName, points }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to decrease points'
        });
      });
    });
  }

  async getPlayerPoints(userName: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('get-player-points', { userName }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to get player points'
        });
      });
    });
  }

  // ===========================================
  // GAME STATE OPERATIONS
  // ===========================================

  async startGame(roomId: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('start-game', { roomId }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to start game'
        });
      });
    });
  }

  async endGame(roomId: string, scores: Record<string, number>, winner: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('end-game', { roomId, scores, winner }, (success: boolean) => {
        resolve({
          success,
          data: success ? { roomId, winner } : undefined,
          error: success ? undefined : 'Failed to end game'
        });
      });
    });
  }

  async resetGame(roomId: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('reset-game', { roomId }, (success: boolean, result?: any) => {
        resolve({
          success,
          data: result,
          error: success ? undefined : result?.error || 'Failed to reset game'
        });
      });
    });
  }

  async getGameState(roomId: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('get-game-state', { roomId }, (success: boolean, gameState?: any) => {
        resolve({
          success,
          data: gameState,
          error: success ? undefined : gameState?.error || 'Failed to get game state'
        });
      });
    });
  }

  // ===========================================
  // MESSAGING
  // ===========================================

  async sendMessage(roomId: string, message: string): Promise<SocketResponse> {
    const connected = await this.ensureConnected();
    if (!connected || !this.socket) {
      return { success: false, error: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('send-message', { roomId, message }, (success: boolean, responseMessage?: string) => {
        resolve({
          success,
          data: success ? { roomId, message } : undefined,
          error: success ? undefined : responseMessage
        });
      });
    });
  }

  // ===========================================
  // SOCKET EVENT LISTENERS (matching backend events)
  // ===========================================

  onUserJoined(callback: (data: { playerId: string; username: string; userCount: number; timestamp: Date }) => void): void {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: { playerId: string; username: string; userCount: number; timestamp: Date }) => void): void {
    this.socket?.on('user-left', callback);
  }

  onMessageReceived(callback: (data: { playerId: string; username: string; message: string; timestamp: Date; roomId: string }) => void): void {
    this.socket?.on('receive-message', callback);
  }

  onGameStarted(callback: (data: { roomId: string; firstPlayer: any; players: any[]; timestamp: Date }) => void): void {
    this.socket?.on('game-started', callback);
  }

  onGameEnded(callback: (data: { roomId: string; winner: string; leaderboard: any[]; timestamp: Date }) => void): void {
    this.socket?.on('game-ended', callback);
  }

  onGameReset(callback: (data: { roomId: string; timestamp: Date }) => void): void {
    this.socket?.on('game-reset', callback);
  }

  onTurnStarted(callback: (data: { turnId: string; role: string; duration: number; timestamp: string }) => void): void {
    this.socket?.on('turn-started', callback);
  }

  onPatternSaved(callback: (data: { roomId: string; turnId: string; pattern: string[]; length: number }) => void): void {
    this.socket?.on('pattern-saved', callback);
  }

  onPatternChecked(callback: (data: { correct: boolean; done: boolean; expectedKey: string; nextIndex: number }) => void): void {
    this.socket?.on('pattern-checked', callback);
  }

  onMatchResultSaved(callback: (data: { roomId: string; match: any; winner: string }) => void): void {
    this.socket?.on('match-result-saved', callback);
  }

  onPointsUpdated(callback: (data: { userName: string; newPoints: number; previousPoints: number }) => void): void {
    this.socket?.on('points-updated', callback);
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Get current player ID
   */
  getPlayerId(): string | null {
    return this.playerId;
  }

  /**
   * Check if player is connected and authenticated
   */
  isConnected(): boolean {
    return this.isPlayerConnected && !!this.socket?.connected;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.isPlayerConnected = false;
    this.connectionPromise = null;
    this.currentUser = null;
    this.playerId = null;
  }

  /**
   * Remove specific event listeners
   */
  removeListener(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    this.socket?.removeAllListeners(event);
  }
}

// Create singleton instance with manual connection
export const socketManager = new SocketManager({ autoConnect: false });

// Export default instance for easy importing
export default socketManager;