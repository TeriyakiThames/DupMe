"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"; // Assumes you have imported and modified this
import { Input } from "@/components/ui/input";   // Assumes you have imported this


export function ClientGameButtons() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const handleJoinGame = () => {
    if (roomId.trim()) {
      // Navigate to the dynamic lobby page with the room ID
      console.log(`Navigating to join room: ${roomId}`);
      // router.push(`/room/${roomId.trim()}`);
      router.push(`/testpage`);
    } else {
      // In a real app, use a custom modal/toast instead of alert
      alert("Please enter a Room ID."); 
    }
  };

  const handleCreateRoom = () => {
    console.log("Navigating to create room page.");
    // Navigate to the separate 'Create a room' page
    router.push('/multiplayer');
  };

  return (
    // We combine the input and buttons here since the input state is directly related to the 'Join Game' button's logic
    <div>
      {/* Room ID Input */}
      <div className="relative mb-6">
        <Input
          id="room-id"
          placeholder="room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          // Custom styling to match the wireframe: white background, larger padding, specific border
          className="w-full py-2 px-4 h-10 text-lg border-2 border-gray-300 rounded-md bg-white placeholder:text-gray-500 focus:border-black"
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col space-y-4">
        <Button
          variant="join"
          className=""
          onClick={handleJoinGame}
        >
          Join Game
        </Button>

        <Button
          variant="create"
          className=""
          onClick={handleCreateRoom}
        >
          Create a room
        </Button>
      </div>
    </div>
  );
}
