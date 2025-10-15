import { socketManager } from './socket-manager';

/**
 * Simple socket client API for interacting with backend
 * No UI concerns, just pure backend socket communication
 */
export class SocketClient {
  private isInitialized = false;

  /**
   * Initialize socket connection with player ID
   */
  async init(playerId: string): Promise<boolean> {
    try {
      socketManager.setPlayerId(playerId);
      const connected = await socketManager.connect();
      this.isInitialized = connected;
      console.log(connected ? '✅ Socket client initialized' : '❌ Socket client failed to initialize');
      return connected;
    } catch (error) {
      console.error('❌ Socket client initialization error:', error);
      return false;
    }
  }

  /**
   * Check if socket is ready
   */
  isReady(): boolean {
    return this.isInitialized && socketManager.isConnected();
  }

  // ===========================================
  // ROOM OPERATIONS
  // ===========================================

  async joinRoom(roomId: string) {
    const result = await socketManager.joinRoom(roomId);
    console.log(`Join room ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async leaveRoom(roomId: string) {
    const result = await socketManager.leaveRoom(roomId);
    console.log(`Leave room ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async getRoomInfo(roomId: string) {
    const result = await socketManager.getRoomInfo(roomId);
    console.log(`Get room info ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  // ===========================================
  // GAME STATE OPERATIONS
  // ===========================================

  async startGame(roomId: string) {
    const result = await socketManager.startGame(roomId);
    console.log(`Start game ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async endGame(roomId: string, scores: Record<string, number>, winner: string) {
    const result = await socketManager.endGame(roomId, scores, winner);
    console.log(`End game ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async resetGame(roomId: string) {
    const result = await socketManager.resetGame(roomId);
    console.log(`Reset game ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async getGameState(roomId: string) {
    const result = await socketManager.getGameState(roomId);
    console.log(`Get game state ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  // ===========================================
  // GAME SERVICE OPERATIONS
  // ===========================================

  async startTurn(turnId: string, role: "creator" | "follower") {
    const result = await socketManager.startTurn(turnId, role);
    console.log(`Start turn ${turnId} (${role}):`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async savePattern(roomId: string, turnId: string, sequence: string[]) {
    const result = await socketManager.savePattern(roomId, turnId, sequence);
    console.log(`Save pattern ${roomId}/${turnId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async checkPattern(roomId: string, turnId: string, key: string) {
    const result = await socketManager.checkPattern(roomId, turnId, key);
    console.log(`Check pattern ${roomId}/${turnId} key(${key}):`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async saveMatchResult(roomId: string, player1: string, player2: string, p1Score: number, p2Score: number, winner: string) {
    const result = await socketManager.saveMatchResult(roomId, player1, player2, p1Score, p2Score, winner);
    console.log(`Save match result ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async increasePoints(userName: string, points: number) {
    const result = await socketManager.increasePoint(userName, points);
    console.log(`Increase points ${userName} +${points}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async decreasePoints(userName: string, points: number) {
    const result = await socketManager.decreasePoint(userName, points);
    console.log(`Decrease points ${userName} -${points}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  async getPlayerPoints(userName: string) {
    const result = await socketManager.getPlayerPoints(userName);
    console.log(`Get player points ${userName}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  // ===========================================
  // MESSAGING
  // ===========================================

  async sendMessage(roomId: string, message: string) {
    const result = await socketManager.sendMessage(roomId, message);
    console.log(`Send message ${roomId}:`, result.success ? '✅' : '❌', result.error || 'Success');
    return result;
  }

  // ===========================================
  // EVENT SUBSCRIPTIONS
  // ===========================================

  onUserJoined(callback: (data: any) => void) {
    socketManager.onUserJoined(callback);
    return () => socketManager.removeListener('user-joined', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    socketManager.onUserLeft(callback);
    return () => socketManager.removeListener('user-left', callback);
  }

  onMessageReceived(callback: (data: any) => void) {
    socketManager.onMessageReceived(callback);
    return () => socketManager.removeListener('receive-message', callback);
  }

  onGameStarted(callback: (data: any) => void) {
    socketManager.onGameStarted(callback);
    return () => socketManager.removeListener('game-started', callback);
  }

  onGameEnded(callback: (data: any) => void) {
    socketManager.onGameEnded(callback);
    return () => socketManager.removeListener('game-ended', callback);
  }

  onGameReset(callback: (data: any) => void) {
    socketManager.onGameReset(callback);
    return () => socketManager.removeListener('game-reset', callback);
  }

  onTurnStarted(callback: (data: any) => void) {
    socketManager.onTurnStarted(callback);
    return () => socketManager.removeListener('turn-started', callback);
  }

  onPatternSaved(callback: (data: any) => void) {
    socketManager.onPatternSaved(callback);
    return () => socketManager.removeListener('pattern-saved', callback);
  }

  onPatternChecked(callback: (data: any) => void) {
    socketManager.onPatternChecked(callback);
    return () => socketManager.removeListener('pattern-checked', callback);
  }

  onMatchResultSaved(callback: (data: any) => void) {
    socketManager.onMatchResultSaved(callback);
    return () => socketManager.removeListener('match-result-saved', callback);
  }

  onPointsUpdated(callback: (data: any) => void) {
    socketManager.onPointsUpdated(callback);
    return () => socketManager.removeListener('points-updated', callback);
  }

  // ===========================================
  // UTILITY
  // ===========================================

  getPlayerId() {
    return socketManager.getPlayerId();
  }

  disconnect() {
    socketManager.disconnect();
    this.isInitialized = false;
    console.log('🔌 Socket client disconnected');
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

// Export default
export default socketClient;