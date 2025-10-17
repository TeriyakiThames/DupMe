"use client";


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from '@/hooks/useSocket';
import type { RoomCardProps } from '@/types/ui';

export function RoomCard({ initialRoomId }: RoomCardProps) {
  const router = useRouter();
  const { getRoomInfo, isConnected } = useSocket();
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (roomId && isConnected) {
        // Optionally get room info before leaving
        await getRoomInfo(roomId);
      }
      router.push('/classic');
    } catch (err) {
      setError('Failed to navigate back');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate room exists on mount if roomId is provided
  useEffect(() => {
    if (roomId && isConnected) {
      const validateRoom = async () => {
        const result = await getRoomInfo(roomId);
        if (!result.success) {
          setError('Room not found or invalid');
        }
      };
      validateRoom();
    }
  }, [roomId, isConnected, getRoomInfo]);

  return (
    // We combine the input and buttons here since the input state is directly related to the 'Join Game' button's logic
    <div>
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
          Not connected to server
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
          {error}
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
          readOnly
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col space-y-4">
        <Button
          variant="cancel"
          className=""
          onClick={handleCancel}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Cancel'}
        </Button>
      </div>
    </div>
  );
}
