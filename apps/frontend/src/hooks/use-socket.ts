import { useEffect, useState, useCallback } from 'react';
import { socketManager, SocketManager } from '../lib/socket-manager';

interface UseSocketReturn {
  // Connection state
  isConnected: boolean;
  playerId: string | null;
  
  // Room operations
  joinRoom: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  getRoomInfo: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Game operations
  startGame: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  endGame: (roomId: string, scores: Record<string, number>, winner: string) => Promise<{ success: boolean; error?: string }>;
  resetGame: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getGameState: (roomId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Messaging
  sendMessage: (roomId: string, message: string) => Promise<{ success: boolean; error?: string }>;
  
  // Event subscription helpers
  onUserJoined: (callback: (data: any) => void) => () => void;
  onUserLeft: (callback: (data: any) => void) => () => void;
  onMessageReceived: (callback: (data: any) => void) => () => void;
  onGameStarted: (callback: (data: any) => void) => () => void;
  onGameEnded: (callback: (data: any) => void) => () => void;
  onGameReset: (callback: (data: any) => void) => () => void;
}

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
    const result = await manager.startGame(roomId);
    return { success: result.success, data: result.data, error: result.error };
  }, [manager]);

  const endGame = useCallback(async (roomId: string, scores: Record<string, number>, winner: string) => {
    const result = await manager.endGame(roomId, scores, winner);
    return { success: result.success, error: result.error };
  }, [manager]);

  const resetGame = useCallback(async (roomId: string) => {
    const result = await manager.resetGame(roomId);
    return { success: result.success, data: result.data, error: result.error };
  }, [manager]);

  const getGameState = useCallback(async (roomId: string) => {
    const result = await manager.getGameState(roomId);
    return { success: result.success, data: result.data, error: result.error };
  }, [manager]);

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
    manager.onGameStarted(callback);
    return () => manager.removeListener('game-started', callback);
  }, [manager]);

  const onGameEnded = useCallback((callback: (data: any) => void) => {
    manager.onGameEnded(callback);
    return () => manager.removeListener('game-ended', callback);
  }, [manager]);

  const onGameReset = useCallback((callback: (data: any) => void) => {
    manager.onGameReset(callback);
    return () => manager.removeListener('game-reset', callback);
  }, [manager]);

  return {
    // Connection state
    isConnected,
    playerId,
    
    // Room operations
    joinRoom,
    leaveRoom,
    getRoomInfo,
    
    // Game operations
    startGame,
    endGame,
    resetGame,
    getGameState,
    
    // Messaging
    sendMessage,
    
    // Event subscriptions
    onUserJoined,
    onUserLeft,
    onMessageReceived,
    onGameStarted,
    onGameEnded,
    onGameReset,
  };
}


