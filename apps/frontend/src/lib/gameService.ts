import { socketManager } from './socketManager';
import { SocketResponse } from '../types/socket';
import { Note, GameMode, 
            GameServiceResponse, 
            StartGameResponse,
            EndGameResponse,
            CheckPatternResponse,
            SavePatternResponse, 
            StartTurnResponse,
            GamePlayer} from '../types/game';


export class SocketGameService {
  constructor() {
    // Ensure socket manager is available
    if (!socketManager) {
      throw new Error('SocketManager is required for SocketGameService');
    }
  }

  /**
   * Check if socket is ready for game operations
   */
  private _ensureConnection(): boolean {
    if (!socketManager.isConnected()) {
      console.error('❌ Socket not connected. Cannot perform game operations.');
      return false;
    }
    return true;
  }

  /**
   * PATCH /increasePoint -> 'game:increase-point'
   */
  async increasePoint(roomId: string, userName: string, points: number): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 Socket: increasePoint(${userName}, +${points}) in room ${roomId}`);
    
    const result = await socketManager.emitWithResponse('game:increase-point', {
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

    console.log(`🎮 Socket: decreasePoint(${userName}, -${points}) in room ${roomId}`);
    
    const result = await socketManager.emitWithResponse('game:decrease-point', {
      roomId,
      userName,
      points
    });

    return result || { success: true };
  }

  /**
   * POST /startGame -> 'game:start'
   */
  async startGame(roomId: string, GamePlayers: GamePlayer[], gameMode?: GameMode): Promise<GameServiceResponse<StartGameResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 Socket: startGame(${roomId})`, { GamePlayers, gameMode });
    
    const result = await socketManager.startGame(roomId);
    
    if (result.success) {
      return {
        success: true,
        data: {
          roomId,
          firstPlayer: result.data?.firstPlayer || GamePlayers[0],
          message: result.data?.message || `Game started in room ${roomId}`,
          gameMode: result.data?.gameMode || gameMode,
          players: result.data?.players || GamePlayers
        }
      };
    }

    return result;
  }

  /**
   * POST /startTurn -> 'game:start-turn'
   */
  async startTurn(roomId: string, turnId: string, role: "creator" | "follower"): Promise<GameServiceResponse<StartTurnResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 Socket: startTurn(${turnId}, ${role}) in room ${roomId}`);
    
    const result = await socketManager.emitWithResponse('game:start-turn', {
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

    console.log(`🎮 Socket: savePattern(${roomId}, ${turnId})`, pattern);
    
    const result = await socketManager.emitWithResponse('game:save-pattern', {
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

    console.log(`🎮 Socket: checkPattern(${roomId}, ${turnId}, note=${note}, index=${index})`);
    
    const result = await socketManager.emitWithResponse('game:check-pattern', {
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

  /**
   * POST /saveMatchResult -> 'game:save-match-result'
   */
  async saveMatchResult(
    roomId: string,
    p1: string,
    p2: string,
    p1Score: number,
    p2Score: number,
    winner: string
  ): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 Socket: saveMatchResult(${roomId})`, {
      p1, p2, p1Score, p2Score, winner
    });
    
    const result = await socketManager.emitWithResponse('game:save-match-result', {
      roomId,
      players: { [p1]: p1Score, [p2]: p2Score },
      winner,
      matchData: { p1, p2, p1Score, p2Score }
    });

    return result || { success: true };
  }

  /**
   * POST /endGame -> 'game:end'
   */
  async endGame(
    roomId: string,
    scores: Record<string, number>,
    winner: string
  ): Promise<GameServiceResponse<EndGameResponse>> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎮 Socket: endGame(${roomId})`, { scores, winner });
    
    const result = await socketManager.endGame(roomId, scores, winner);

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

    console.log(`🎮 Socket: resetGame(${roomId})`);
    
    const result = await socketManager.resetGame(roomId);
    return result || { success: true };
  }

  // =============================================================================
  // ADDITIONAL SOCKET-SPECIFIC METHODS
  // =============================================================================

  /**
   * Submit a note press (real-time game action)
   */
  async submitNote(roomId: string, note: Note, playerId: string): Promise<GameServiceResponse> {
    if (!this._ensureConnection()) {
      return { success: false, error: 'Socket not connected' };
    }

    console.log(`🎵 Socket: submitNote(${note}) in room ${roomId}`);
    
    socketManager.emit('game:note-press', {
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

    console.log(`🎵 Socket: releaseNote(${note}) in room ${roomId}`);
    
    socketManager.emit('game:note-release', {
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

    console.log(`🎮 Socket: setGameMode(${mode}) in room ${roomId}`);
    
    const result = await socketManager.emitWithResponse('game:set-mode', {
      roomId,
      mode
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

    console.log(`🎮 Socket: getGameState(${roomId})`);
    
    return await socketManager.getGameState(roomId);
  }

  // =============================================================================
  // EVENT SUBSCRIPTION HELPERS
  // =============================================================================

  /**
   * Subscribe to game events
   */
  onGameEvent(eventName: string, callback: (data: any) => void): () => void {
    socketManager.on(`game:${eventName}`, callback);
    return () => socketManager.off(`game:${eventName}`, callback);
  }

  /**
   * Subscribe to note events
   */
  onNotePress(callback: (data: { note: Note; user: string; roomId: string }) => void): () => void {
    return this.onGameEvent('note-press', callback);
  }

  onNoteRelease(callback: (data: { note: Note; user: string; roomId: string }) => void): () => void {
    return this.onGameEvent('note-release', callback);
  }

  /**
   * Subscribe to turn changes
   */
  onTurnChange(callback: (data: { turn: "Create" | "Reproduce"; user: string; roomId: string }) => void): () => void {
    return this.onGameEvent('turn-change', callback);
  }

  /**
   * Subscribe to pattern completion
   */
  onPatternComplete(callback: (data: { pattern: Note[]; roomId: string }) => void): () => void {
    return this.onGameEvent('pattern-complete', callback);
  }

  /**
   * Subscribe to score updates
   */
  onScoreUpdate(callback: (data: { user: string; points: number; roomId: string }) => void): () => void {
    return this.onGameEvent('score-update', callback);
  }
}

// Create singleton instance
export const socketGameService = new SocketGameService();

// Export both the class and singleton for flexibility
export default socketGameService;