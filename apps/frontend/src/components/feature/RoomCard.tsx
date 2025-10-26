"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";   

export function RoomCard() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('1134');

  const handleCancel = () => {
    console.log("Cancel create room page.");
    // Navigate to the separate 'Create a room' page
    navigate('/classic');
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
          readOnly
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col space-y-4">
        <Button
          variant="cancel"
          className=""
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}