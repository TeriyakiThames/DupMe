"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from '@/hooks/useAuth';
import { ClientGameComponentProps } from '@/types/components';
import { ServerEventBroadcast } from '@/types/socket';

export function ClientGameButtons({
  joinRoom,
  getRoomInfo,
  isConnected,
}: ClientGameComponentProps) {
  const router = useRouter();
  const { isAuthenticated, userProfile } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinGame = async () => {
    if (!roomId.trim()) {
      setError('Please enter a Room ID.');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    if (!isAuthenticated) {
      setError('Please log in to join a game.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First check if room exists
      const roomInfo = await getRoomInfo({ roomId: roomId.trim() }) as ServerEventBroadcast;
      if (!roomInfo.success) {
        setError('Room not found or is full.');
        return;
      }

      // Try to join the room
      const joinResult = await joinRoom({ roomId: roomId.trim() }) as ServerEventBroadcast;
      if (joinResult.success) {
        router.push(`/room/${roomId.trim()}`);
      } else {

        setError(joinResult.error || 'Failed to join room.');
      }
    } catch (err) {
      setError('Failed to join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!isAuthenticated) {
      setError('Please log in to create a room.');
      return;
    }
    
    router.push('/create');
  };

  return (
    <div>
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
          Not connected to server
        </div>
      )}
      
      {/* Authentication Status */}
      {!isAuthenticated && (
        <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded text-blue-800 text-sm">
          Please log in to access multiplayer features
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Room ID Input */}
      <div className="relative mb-6">
        <Input
          id="room-id"
          placeholder="room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full py-2 px-4 h-10 text-lg border-2 border-gray-300 rounded-md bg-white placeholder:text-gray-500 focus:border-black"
          disabled={isLoading || !isConnected}
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col space-y-4">
        <Button
          variant="join"
          className=""
          onClick={handleJoinGame}
          disabled={isLoading || !isConnected || !isAuthenticated}
        >
          {isLoading ? 'Joining...' : 'Join Game'}
        </Button>

        <Button
          variant="create"
          className=""
          onClick={handleCreateRoom}
          disabled={!isAuthenticated}
        >
          Create a room
        </Button>
      </div>
    </div>
  );
}
