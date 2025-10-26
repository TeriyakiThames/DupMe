"use client"

// useSocket.ts
// React hook to unify socketManager and socketGameManager
import { useEffect, useRef, useState } from 'react';
import { createSocketManager, SocketManager, socketManager } from '../lib/socketManager';
import { createSocketGameManager, SocketGameManager, socketGameManager } from '../lib/socketGameManager';
import { UserProfile } from '@/types/auth';
import { Socket } from 'socket.io-client';
import { ServerEventBroadcast, ServerEventRequest } from '@/types/socket';
import { RoomEventBroadcast, RoomEventRequest } from '@/types/socketGame';

export function useSocket() {
  const managerRef = useRef<SocketManager | null>(null);
  const gameManagerRef = useRef<SocketGameManager | null>(null);
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
    createRoom: (data: ServerEventRequest) => managerRef.current?.createRoom(data),
    joinRoom: (data: ServerEventRequest) => managerRef.current?.joinRoom(data),
    leaveRoom: (data: ServerEventRequest) => managerRef.current?.leaveRoom(data),
    getRoomInfo: (data: ServerEventRequest) => managerRef.current?.getRoomInfo(data),
    getServerStats: () => managerRef.current?.getServerStats(),
    onRoomEvent: (event: string, cb: (data: ServerEventBroadcast ) => void) => managerRef.current?.on(event, cb),
    offRoomEvent: (event: string, cb: (data: ServerEventBroadcast ) => void) => managerRef.current?.off(event, cb),
    // Game actions
    startGame: (data: RoomEventRequest) => gameManagerRef.current?.startGame(data),
    saveSequence: (data: RoomEventRequest) => gameManagerRef.current?.saveSequence(data),
    submitRoundResult: (data: RoomEventRequest) => gameManagerRef.current?.submitRoundResult(data),
    endGame: (data: RoomEventRequest) => gameManagerRef.current?.endGame(data),
    resetGame: (data: RoomEventRequest) => gameManagerRef.current?.resetGame(data),
    getGameState: (data: RoomEventRequest) => gameManagerRef.current?.getGameState(data),
    onGameEvent: (event: string, cb: (data : RoomEventBroadcast) => void) => gameManagerRef.current?.on(event, cb),
    offGameEvent: (event: string, cb: (data : RoomEventBroadcast) => void) => gameManagerRef.current?.off(event, cb),
  };
}
