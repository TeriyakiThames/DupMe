import { Socket } from 'socket.io-client';
import { initSocket, getSocket } from './socketClient';
import { SocketResponse } from '../types/socket';
import { Note, GameMode, 
            GameServiceResponse, 
            StartGameResponse,
            EndGameResponse,
            CheckPatternResponse,
            SavePatternResponse, 
            StartTurnResponse,
            GamePlayer} from '../types/game';

interface SocketGameManagerConfig {
  serverUrl?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class SocketGameManager {
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private isPlayerConnected: boolean = false;
  private config: Required<SocketGameManagerConfig>;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(config: SocketGameManagerConfig = {}) {
    this.config = {
      serverUrl: config.serverUrl || process.env.BACKEND_URL || 'http://localhost:4000',
      autoConnect: config.autoConnect ?? false,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 3000,
    };
  }

  /**
   * Initialize with existing socket connection
   */
  initialize(): void {
    this.socket = getSocket();
    this.isPlayerConnected = this.socket?.connected ?? false;
    
    if (this.socket) {
      this._setupGameEventListeners();
    }
  }

  /**
   * Check if socket is ready for game operations
   */
  private _ensureConnection(): boolean {
    if (!this.socket || !this.isPlayerConnected) {
      console.error('❌ Socket not connected. Cannot perform game operations.');
      return false;
    }
    return true;
  }

  /**
   * Set player ID
   */
  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  /**
   * Get current player ID
   */
  getPlayerId(): string | null {
    return this.playerId;
  }

  /**
   * Set up game-specific event listeners
   */
  private _setupGameEventListeners(): void {
    if (!this.socket) return;

    // Forward game events to registered listeners
    this.socket.on('game:note-press', (data) => this._emitToListeners('note-press', data));
    this.socket.on('game:note-release', (data) => this._emitToListeners('note-release', data));
    this.socket.on('game:score-update', (data) => this._emitToListeners('score-update', data));
    this.socket.on('game:turn-change', (data) => this._emitToListeners('turn-change', data));
    this.socket.on('game:pattern-complete', (data) => this._emitToListeners('pattern-complete', data));
    this.socket.on('game:started', (data) => this._emitToListeners('started', data));
    this.socket.on('game:ended', (data) => this._emitToListeners('ended', data));
    this.socket.on('game:reset', (data) => this._emitToListeners('reset', data));
  }

  // =============================================================================
  // GAME OPERATIONS
  // =============================================================================

  /**
   * PATCH /increasePoint -> 'game:increase-point'
   */
  async increasePoint(roomId: string, userName: string, points: number): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: increasePoint(${userName}, +${points}) in room ${roomId}`);
    
    const result = await this._emitWithResponse('game:increase-point', {
      roomId,
      userName,
      points
    });

    return result || { success: true };
  }

  /**
   * PATCH /decreasePoint -> 'game:decrease-point'
   */
  async decreasePoint(roomId: string, userName: string, points: number): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: decreasePoint(${userName}, -${points}) in room ${roomId}`);
    
    const result = await this._emitWithResponse('game:decrease-point', {
      roomId,
      userName,
      points
    });

    return result || { success: true };
  }

  /**
   * POST /startGame -> 'game:start'
   */
  async startGame(roomId: string, gamePlayers: GamePlayer[], gameMode?: GameMode): Promise<GameServiceResponse<StartGameResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: startGame(${roomId})`, { gamePlayers, gameMode });
    
    const result = await this._emitWithResponse('game:start', {
      roomId,
      players: gamePlayers,
      gameMode,
      playerId: this.playerId
    });
    
    if (result.success) {
      return {
        success: true,
        data: {
          roomId,
          firstPlayer: result.data?.firstPlayer || gamePlayers[0],
          message: result.data?.message || `Game started in room ${roomId}`,
          gameMode: result.data?.gameMode || gameMode,
          players: result.data?.players || gamePlayers
        }
      };
    }

    return result;
  }

  /**
   * POST /endGame -> 'game:end'
   */
  async endGame(roomId: string, scores: Record<string, number>, winner: string): Promise<GameServiceResponse<EndGameResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: endGame(${roomId})`, { scores, winner });
    
    const result = await this._emitWithResponse('game:end', {
      roomId,
      scores,
      winner,
      playerId: this.playerId
    });

    if (result.success) {
      const leaderboard = Object.entries(scores)
        .map(([user, pts]) => ({ user, pts }))
        .sort((a, b) => b.pts - a.pts);

      return {
        success: true,
        data: {
          message: result.data?.message || `Game ended. Winner: ${winner}`,
          leaderboard,
          winner,
          finalScores: scores
        }
      };
    }

    return result;
  }

  /**
   * POST /resetGame -> 'game:reset'
   */
  async resetGame(roomId: string): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: resetGame(${roomId})`);
    
    const result = await this._emitWithResponse('game:reset', {
      roomId,
      playerId: this.playerId
    });

    return result || { success: true };
  }

  /**
   * Get current game state
   */
  async getGameState(roomId: string): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: getGameState(${roomId})`);
    
    return await this._emitWithResponse('game:get-state', {
      roomId
    });
  }

  /**
   * POST /startTurn -> 'game:start-turn'
   */
  async startTurn(roomId: string, turnId: string, role: "creator" | "follower"): Promise<GameServiceResponse<StartTurnResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: startTurn(${turnId}, ${role}) in room ${roomId}`);
    
    const result = await this._emitWithResponse('game:start-turn', {
      roomId,
      turnId,
      role
    });

    if (result.success) {
      return {
        success: true,
        data: {
          turnId,
          role,
          duration: result.data?.duration || (role === "creator" ? 10 : 20),
          message: result.data?.message || `It's now ${role}'s turn.`,
          turn: role === "creator" ? "Create" : "Reproduce"
        }
      };
    }

    return result;
  }

  /**
   * POST /savePattern -> 'game:save-pattern'
   */
  async savePattern(roomId: string, turnId: string, pattern: Note[]): Promise<GameServiceResponse<SavePatternResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: savePattern(${roomId}, ${turnId})`, pattern);
    
    const result = await this._emitWithResponse('game:save-pattern', {
      roomId,
      turnId,
      pattern
    });

    if (result.success) {
      return {
        success: true,
        data: {
          success: true,
          length: pattern.length,
          pattern: result.data?.pattern || pattern
        }
      };
    }

    return result;
  }

  /**
   * POST /checkPattern -> 'game:check-pattern'
   */
  async checkPattern(roomId: string, turnId: string, note: Note, index: number): Promise<GameServiceResponse<CheckPatternResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: checkPattern(${roomId}, ${turnId}, note=${note}, index=${index})`);
    
    const result = await this._emitWithResponse('game:check-pattern', {
      roomId,
      turnId,
      note,
      index
    });

    if (result.success) {
      return {
        success: true,
        data: {
          correct: result.data?.correct || false,
          nextIndex: result.data?.nextIndex || index + 1,
          done: result.data?.done || false,
          expectedNote: result.data?.expectedNote,
          actualNote: note
        }
      };
    }

    return result;
  }

  // =============================================================================
  // REAL-TIME GAME ACTIONS
  // =============================================================================

  /**
   * Submit a note press (real-time game action)
   */
  async submitNote(roomId: string, note: Note, playerId: string): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎵 GameManager: submitNote(${note}) in room ${roomId}`);
    
    this.socket!.emit('game:note-press', {
      roomId,
      note,
      playerId,
      timestamp: Date.now()
    });

    return { success: true };
  }

  /**
   * Submit note release (for sustained notes)
   */
  async releaseNote(roomId: string, note: Note, playerId: string): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎵 GameManager: releaseNote(${note}) in room ${roomId}`);
    
    this.socket!.emit('game:note-release', {
      roomId,
      note,
      playerId,
      timestamp: Date.now()
    });

    return { success: true };
  }

  /**
   * Set game mode
   */
  async setGameMode(roomId: string, mode: GameMode): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 GameManager: setGameMode(${mode}) in room ${roomId}`);
    
    const result = await this._emitWithResponse('game:set-mode', {
      roomId,
      mode
    });

    return result || { success: true };
  }

  // =============================================================================
  // EVENT SUBSCRIPTION
  // =============================================================================

  /**
   * Subscribe to game events
   */
  on(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);
  }

  /**
   * Unsubscribe from game events
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

  // Convenience methods for common events
  onNotePress(callback: (data: { note: Note; user: string; roomId: string }) => void): () => void {
    this.on('note-press', callback);
    return () => this.off('note-press', callback);
  }

  onNoteRelease(callback: (data: { note: Note; user: string; roomId: string }) => void): () => void {
    this.on('note-release', callback);
    return () => this.off('note-release', callback);
  }

  onScoreUpdate(callback: (data: { user: string; points: number; roomId: string }) => void): () => void {
    this.on('score-update', callback);
    return () => this.off('score-update', callback);
  }

  onTurnChange(callback: (data: { turn: "Create" | "Reproduce"; user: string; roomId: string }) => void): () => void {
    this.on('turn-change', callback);
    return () => this.off('turn-change', callback);
  }

  onPatternComplete(callback: (data: { pattern: Note[]; roomId: string }) => void): () => void {
    this.on('pattern-complete', callback);
    return () => this.off('pattern-complete', callback);
  }

  onGameStarted(callback: (data: any) => void): () => void {
    this.on('started', callback);
    return () => this.off('started', callback);
  }

  onGameEnded(callback: (data: any) => void): () => void {
    this.on('ended', callback);
    return () => this.off('ended', callback);
  }

  onGameReset(callback: (data: any) => void): () => void {
    this.on('reset', callback);
    return () => this.off('reset', callback);
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async _emitWithResponse(event: string, data: any, timeout: number = 5000): Promise<SocketResponse> {
    if (!this.socket || !this.isPlayerConnected) {
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
          console.error(`Error in game event listener for ${eventName}:`, error);
        }
      });
    }
  }
}

// Create singleton instance
export const socketGameManager = new SocketGameManager();

// Export both the class and the singleton
export default socketGameManager;