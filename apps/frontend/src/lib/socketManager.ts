import { Socket } from 'socket.io-client';
import { initSocket, getSocket } from './socketClient';
import { SocketResponse } from '../types/socket';
import { SocketManagerConfig } from '../types/socket';
import { UserProfile  } from '../types/user';

export class SocketManager {
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private currentUser: UserProfile | null = null;
  private isPlayerConnected: boolean = false;
  private connectionPromise: Promise<boolean> | null = null;
  private config: Required<SocketManagerConfig>;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: SocketManagerConfig = {}) {
    this.config = {
      serverUrl: config.serverUrl || process.env.BACKEND_URL || 'http://localhost:4000',
      autoConnect: config.autoConnect ?? false,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 3000,
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

    if (!this.playerId) {
      console.error('❌ Cannot connect without a player ID');
      return false;
    }

    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._performConnection();
    const result = await this.connectionPromise;
    this.connectionPromise = null;
    return result;
  }

  private async _performConnection(): Promise<boolean> {
    try {
      console.log('🔌 Attempting to connect socket with player ID:', this.playerId);
      
      // Use the socketClient to initialize the connection
      this.socket = initSocket('', this.playerId!);
      
      if (!this.socket) {
        console.error('❌ Failed to initialize socket');
        return false;
      }

      // Set up event listeners
      this._setupEventListeners();

      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('❌ Socket connection timeout');
          resolve(false);
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Socket connected successfully');
          this.isPlayerConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Socket connection error:', error);
          this._handleReconnect();
          resolve(false);
        });
      });
    } catch (error) {
      console.error('❌ Socket connection failed:', error);
      this._handleReconnect();
      return false;
    }
  }

  private _setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isPlayerConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect automatically
        console.log('🚪 Server disconnected - not reconnecting');
      } else {
        // Client side disconnect - attempt reconnect
        this._handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Forward events to registered listeners
    this.socket.onAny((eventName, ...args) => {
      this._emitToListeners(eventName, ...args);
    });
  }

  private _handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.config.reconnectAttempts}`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectDelay);
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isPlayerConnected = false;
    this.currentUser = null;
    console.log('🔌 Socket disconnected');
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current player ID
   */
  getPlayerId(): string | null {
    return this.playerId;
  }

  /**
   * Set player ID
   */
  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  /**
   * Set current user
   */
  setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
    this.playerId = user.id;
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  // =============================================================================
  // ROOM OPERATIONS
  // =============================================================================

  /**
   * Join a room
   */
  async joinRoom(roomId: string): Promise<SocketResponse> {
    return this._emitWithResponse('join-room', { roomId, playerId: this.playerId });
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<SocketResponse> {
    return this._emitWithResponse('leave-room', { roomId, playerId: this.playerId });
  }

  /**
   * Get room information
   */
  async getRoomInfo(roomId: string): Promise<SocketResponse> {
    return this._emitWithResponse('get-room-info', { roomId });
  }

  /**
   * Create a new room
   */
  async createRoom(roomData: any): Promise<SocketResponse> {
    return this._emitWithResponse('create-room', { ...roomData, playerId: this.playerId });
  }

  // =============================================================================
  // MESSAGING
  // =============================================================================

  /**
   * Send a message to a room
   */
  async sendMessage(roomId: string, message: string): Promise<SocketResponse> {
    return this._emitWithResponse('send-message', { 
      roomId, 
      message, 
      playerId: this.playerId 
    });
  }

  // =============================================================================
  // EVENT SUBSCRIPTION
  // =============================================================================

  /**
   * Subscribe to socket events
   */
  on(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);
  }

  /**
   * Unsubscribe from socket events
   */
  off(eventName: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventName);
      }
    }
  }

  /**
   * Remove listener (alias for off)
   */
  removeListener(eventName: string, callback: Function): void {
    this.off(eventName, callback);
  }

  // Convenience methods for common events
  onUserJoined(callback: (data: any) => void): void {
    this.on('user-joined', callback);
  }

  onUserLeft(callback: (data: any) => void): void {
    this.on('user-left', callback);
  }

  onMessageReceived(callback: (data: any) => void): void {
    this.on('receive-message', callback);
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async _emitWithResponse(event: string, data: any, timeout: number = 5000): Promise<SocketResponse> {
    if (!this.socket || !this.isConnected()) {
      return {
        success: false,
        error: 'Socket is not connected'
      };
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: 'Request timeout'
        });
      }, timeout);

      this.socket!.emit(event, data, (response: SocketResponse) => {
        clearTimeout(timeoutId);
        resolve(response || { success: false, error: 'No response received' });
      });
    });
  }

  private _emitToListeners(eventName: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Emit an event without expecting a response
   */
  emit(eventName: string, data: any): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('Cannot emit event: socket not connected');
    }
  }

  /**
   * Emit an event and expect a response (public method for game service)
   */
  async emitWithResponse(event: string, data: any, timeout: number = 5000): Promise<SocketResponse> {
    return this._emitWithResponse(event, data, timeout);
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const socketManager = new SocketManager();

// Export both the class and the singleton
export default socketManager;
