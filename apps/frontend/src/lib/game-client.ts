import { authClient, AuthClient } from './auth-client';
import { socketManager, SocketManager } from './socket-manager';

interface User {
  id: number;
  username: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}

interface GameClientConfig {
  apiUrl?: string;
  socketUrl?: string;
}

export class GameClient {
  private authClient: AuthClient;
  private socketManager: SocketManager;
  private currentUser: User | null = null;
  private isInitialized: boolean = false;

  constructor(config: GameClientConfig = {}) {
    this.authClient = authClient;
    this.socketManager = socketManager;
    
    // Configure socket manager with custom URL if provided
    if (config.socketUrl) {
      this.socketManager = new SocketManager({ 
        serverUrl: config.socketUrl,
        autoConnect: false 
      });
    }
  }

  /**
   * Initialize the game client (check existing auth + setup socket)
   */
  async initialize(): Promise<User | null> {
    if (this.isInitialized) {
      return this.currentUser;
    }

    try {
      // Check if user is already authenticated
      const user = await this.authClient.initialize();
      
      if (user) {
        this.currentUser = user;
        // Set user data in socket manager
        this.socketManager.setUser(user);
        console.log(`✅ Game client initialized for user: ${user.username}`);
      } else {
        console.log('📝 Game client initialized - user not authenticated');
      }

      this.isInitialized = true;
      return user;
    } catch (error) {
      console.error('Failed to initialize game client:', error);
      this.isInitialized = true;
      return null;
    }
  }

  /**
   * Register a new user and connect to socket
   */
  async register(username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const result = await this.authClient.register({ username, password });
      
      if (result.success && result.user) {
        this.currentUser = result.user;
        this.socketManager.setUser(result.user);
        
        // Auto-connect to socket after successful registration
        const socketConnected = await this.socketManager.connect();
        
        return {
          success: true,
          message: `Welcome ${result.user.username}! Registration successful.`,
          user: result.user,
        };
      }

      return {
        success: false,
        message: result.message || 'Registration failed',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error during registration',
      };
    }
  }

  /**
   * Login user and connect to socket
   */
  async login(username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const result = await this.authClient.login({ username, password });
      
      if (result.success && result.user) {
        this.currentUser = result.user;
        this.socketManager.setUser(result.user);
        
        // Auto-connect to socket after successful login
        const socketConnected = await this.socketManager.connect();
        
        return {
          success: true,
          message: `Welcome back ${result.user.username}!`,
          user: result.user,
        };
      }

      return {
        success: false,
        message: result.message || 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error during login',
      };
    }
  }

  /**
   * Logout user and disconnect from socket
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      // Disconnect from socket first
      this.socketManager.disconnect();
      
      // Then logout from API
      const result = await this.authClient.logout();
      
      if (result.success) {
        this.currentUser = null;
        console.log('👋 User logged out successfully');
      }

      return result;
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Network error during logout',
      };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.socketManager.isConnected();
  }

  /**
   * Manually connect to socket (if user is authenticated)
   */
  async connectSocket(): Promise<boolean> {
    if (!this.currentUser) {
      console.error('Cannot connect socket: user not authenticated');
      return false;
    }

    return await this.socketManager.connect();
  }

  /**
   * Disconnect from socket
   */
  disconnectSocket(): void {
    this.socketManager.disconnect();
  }

  // ===========================================
  // ROOM OPERATIONS (proxy to socket manager)
  // ===========================================

  async joinRoom(roomId: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to join rooms');
    }
    return await this.socketManager.joinRoom(roomId);
  }

  async leaveRoom(roomId: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to leave rooms');
    }
    return await this.socketManager.leaveRoom(roomId);
  }

  async getRoomInfo(roomId: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to get room info');
    }
    return await this.socketManager.getRoomInfo(roomId);
  }

  async sendMessage(roomId: string, message: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to send messages');
    }
    return await this.socketManager.sendMessage(roomId, message);
  }

  // ===========================================
  // GAME OPERATIONS (proxy to socket manager)
  // ===========================================

  async startGame(roomId: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to start games');
    }
    return await this.socketManager.startGame(roomId);
  }

  async endGame(roomId: string, scores: Record<string, number>, winner: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to end games');
    }
    return await this.socketManager.endGame(roomId, scores, winner);
  }

  async resetGame(roomId: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to reset games');
    }
    return await this.socketManager.resetGame(roomId);
  }

  async getGameState(roomId: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to get game state');
    }
    return await this.socketManager.getGameState(roomId);
  }

  // ===========================================
  // EVENT LISTENERS (proxy to socket manager)
  // ===========================================

  onUserJoined(callback: (data: { playerId: string; username: string; userCount: number; timestamp: Date }) => void) {
    this.socketManager.onUserJoined(callback);
  }

  onUserLeft(callback: (data: { playerId: string; username: string; userCount: number; timestamp: Date }) => void) {
    this.socketManager.onUserLeft(callback);
  }

  onMessageReceived(callback: (data: { playerId: string; username: string; message: string; timestamp: Date; roomId: string }) => void) {
    this.socketManager.onMessageReceived(callback);
  }

  onGameStarted(callback: (data: { roomId: string; firstPlayer: any; players: any[]; timestamp: Date }) => void) {
    this.socketManager.onGameStarted(callback);
  }

  onGameEnded(callback: (data: { roomId: string; winner: string; leaderboard: any[]; timestamp: Date }) => void) {
    this.socketManager.onGameEnded(callback);
  }

  onGameReset(callback: (data: { roomId: string; timestamp: Date }) => void) {
    this.socketManager.onGameReset(callback);
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Get authentication client (for advanced auth operations)
   */
  getAuthClient(): AuthClient {
    return this.authClient;
  }

  /**
   * Get socket manager (for advanced socket operations)
   */
  getSocketManager(): SocketManager {
    return this.socketManager;
  }

  /**
   * Remove all event listeners
   */
  cleanup(): void {
    this.socketManager.removeAllListeners();
  }
}

// Create singleton instance
export const gameClient = new GameClient();

// Export default instance for easy importing
export default gameClient;