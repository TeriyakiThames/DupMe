import { useEffect, useState, useCallback } from 'react';
import { socketManager, SocketManager } from '../lib/socketManager';
import { socketGameManager } from '../lib/socketGameManager';
import { UseSocketReturn } from '../types/socket';

export function useSocket(customSocketManager?: SocketManager): UseSocketReturn {
  const manager = customSocketManager || socketManager;
  const [isConnected, setIsConnected] = useState(manager.isConnected());
  const [playerId, setPlayerId] = useState(manager.getPlayerId());

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(manager.isConnected());
      setPlayerId(manager.getPlayerId());
    };

    // Check immediately
    checkConnection();

    // Initialize game manager with socket connection
    socketGameManager.initialize();
    if (manager.getPlayerId()) {
      socketGameManager.setPlayerId(manager.getPlayerId()!);
    }

    // Set up interval to check connection status
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [manager]);

  // Room operations
  const joinRoom = useCallback(async (roomId: string) => {
    const result = await manager.joinRoom(roomId);
    return { success: result.success, error: result.error };
  }, [manager]);

  const leaveRoom = useCallback(async (roomId: string) => {
    const result = await manager.leaveRoom(roomId);
    return { success: result.success, error: result.error };
  }, [manager]);

  const getRoomInfo = useCallback(async (roomId: string) => {
    const result = await manager.getRoomInfo(roomId);
    return { success: result.success, data: result.data, error: result.error };
  }, [manager]);

  // Game operations
  const startGame = useCallback(async (roomId: string) => {
    const result = await socketGameManager.startGame(roomId, []);
    return { success: result.success, data: result.data, error: result.error };
  }, []);

  const endGame = useCallback(async (roomId: string, scores: Record<string, number>, winner: string) => {
    const result = await socketGameManager.endGame(roomId, scores, winner);
    return { success: result.success, error: result.error };
  }, []);

  const resetGame = useCallback(async (roomId: string) => {
    const result = await socketGameManager.resetGame(roomId);
    return { success: result.success, data: result.data, error: result.error };
  }, []);

  const getGameState = useCallback(async (roomId: string) => {
    const result = await socketGameManager.getGameState(roomId);
    return { success: result.success, data: result.data, error: result.error };
  }, []);

  // Messaging
  const sendMessage = useCallback(async (roomId: string, message: string) => {
    const result = await manager.sendMessage(roomId, message);
    return { success: result.success, error: result.error };
  }, [manager]);

  // Event subscription helpers
  const onUserJoined = useCallback((callback: (data: any) => void) => {
    manager.onUserJoined(callback);
    return () => manager.removeListener('user-joined', callback);
  }, [manager]);

  const onUserLeft = useCallback((callback: (data: any) => void) => {
    manager.onUserLeft(callback);
    return () => manager.removeListener('user-left', callback);
  }, [manager]);

  const onMessageReceived = useCallback((callback: (data: any) => void) => {
    manager.onMessageReceived(callback);
    return () => manager.removeListener('receive-message', callback);
  }, [manager]);

  const onGameStarted = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onGameStarted(callback);
  }, []);

  const onGameEnded = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onGameEnded(callback);
  }, []);

  const onGameReset = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onGameReset(callback);
  }, []);

  // Game-specific methods using gameManager
  const submitNote = useCallback(async (roomId: string, note: string, playerId: string) => {
    const result = await socketGameManager.submitNote(roomId, note as any, playerId);
    return { success: result.success, error: result.error };
  }, []);

  const releaseNote = useCallback(async (roomId: string, note: string, playerId: string) => {
    const result = await socketGameManager.releaseNote(roomId, note as any, playerId);
    return { success: result.success, error: result.error };
  }, []);

  const increasePoint = useCallback(async (roomId: string, userName: string, points: number) => {
    const result = await socketGameManager.increasePoint(roomId, userName, points);
    return { success: result.success, error: result.error };
  }, []);

  const decreasePoint = useCallback(async (roomId: string, userName: string, points: number) => {
    const result = await socketGameManager.decreasePoint(roomId, userName, points);
    return { success: result.success, error: result.error };
  }, []);

  const savePattern = useCallback(async (roomId: string, turnId: string, pattern: string[]) => {
    const result = await socketGameManager.savePattern(roomId, turnId, pattern as any);
    return { success: result.success, data: result.data, error: result.error };
  }, []);

  const checkPattern = useCallback(async (roomId: string, turnId: string, note: string, index: number) => {
    const result = await socketGameManager.checkPattern(roomId, turnId, note as any, index);
    return { success: result.success, data: result.data, error: result.error };
  }, []);

  // Game event subscriptions
  const onNotePress = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onNotePress(callback);
  }, []);

  const onNoteRelease = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onNoteRelease(callback);
  }, []);

  const onScoreUpdate = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onScoreUpdate(callback);
  }, []);

  const onTurnChange = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onTurnChange(callback);
  }, []);

  const onPatternComplete = useCallback((callback: (data: any) => void) => {
    return socketGameManager.onPatternComplete(callback);
  }, []);

  return {
    // Connection state
    // isConnected,
    // playerId,
    socket: manager.getSocket(),
    isConnected,


    // Room operations
    joinRoom,
    leaveRoom,
    getRoomInfo,
    
    // Game operations
    startGame,
    endGame,
    resetGame,
    getGameState,
    
    // Game-specific methods
    submitNote,
    releaseNote,
    increasePoint,
    decreasePoint,
    savePattern,
    checkPattern,
    
    // Messaging
    sendMessage,
    
    // Room event subscriptions
    onUserJoined,
    onUserLeft,
    onMessageReceived,
    onGameStarted,
    onGameEnded,
    onGameReset,
    
    // Game event subscriptions
    onNotePress,
    onNoteRelease,
    onScoreUpdate,
    onTurnChange,
    onPatternComplete,
  };
}


