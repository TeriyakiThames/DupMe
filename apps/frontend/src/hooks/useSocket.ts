"use client"

// useSocket.ts
// React hook to unify socketManager and socketGameManager
import { useEffect, useRef, useState } from 'react';
import { createSocketManager, socketManager } from '../lib/socketManager';
import { createSocketGameManager, socketGameManager } from '../lib/socketGameManager';
import { UserProfile } from '@/types/auth';

export function useSocket() {
  const managerRef = useRef<any>(null);
  const gameManagerRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // NOTE: Handled in socket backend
    // Only initialize socket managers if userProfile is valid and no socket exists
    // if (!userProfile) {
    //   // Disconnect socket on logout or missing user
    //   if (managerRef.current?.socket) {
    //     managerRef.current.socket.disconnect();
    //   }
    //   managerRef.current = null;
    //   gameManagerRef.current = null;
    //   setIsConnected(false);
    //   return;
    // }

    // Singleton socket: only create if not already connected
    if (!managerRef.current) {
      managerRef.current = createSocketManager();
      gameManagerRef.current = createSocketGameManager();
    }

    const socket = managerRef.current?.socket;
    if (socket) {
      setIsConnected(socket.connected);
    }

    return () => {
      // Clean up only on unmount, not on every rerender
      // Do not disconnect unless logging out (handled above)
    };
  }, []);

  return {
    isConnected,

    // Room actions
    createRoom: (data: any) => managerRef.current?.createRoom(data),
    joinRoom: (data: any) => managerRef.current?.joinRoom(data),
    leaveRoom: (data: any) => managerRef.current?.leaveRoom(data),
    getRoomInfo: (data: any) => managerRef.current?.getRoomInfo(data),
    getServerStats: () => managerRef.current?.getServerStats(),
    onRoomEvent: (event: string, cb: Function) => managerRef.current?.on(event, cb),
    offRoomEvent: (event: string, cb: Function) => managerRef.current?.off(event, cb),
    // Game actions
    startGame: (data: any) => gameManagerRef.current?.startGame(data),
    saveSequence: (data: any) => gameManagerRef.current?.saveSequence(data),
    submitRoundResult: (data: any) => gameManagerRef.current?.submitRoundResult(data),
    endGame: (data: any) => gameManagerRef.current?.endGame(data),
    resetGame: (data: any) => gameManagerRef.current?.resetGame(data),
    getGameState: (data: any) => gameManagerRef.current?.getGameState(data),
    onGameEvent: (event: string, cb: Function) => gameManagerRef.current?.on(event, cb),
    offGameEvent: (event: string, cb: Function) => gameManagerRef.current?.off(event, cb),
  };
}
