'use client';

import { useState } from "react";
import { PlayerList } from "./PlayerList";
import { Input } from "@/components/ui/input";
import { Button } from "./button";
import { useRouter } from 'next/navigation';

export function WaitingRoom() {
  const [roomId] = useState('1134');
  const [players, setPlayers] = useState([{ id: 1, name: 'You', isHost: true }, { id: 1, name: 'You', isHost: true }]);
  const MAX_PLAYERS = 2;
  const isLobbyFull = players.length < MAX_PLAYERS;
  const router = useRouter();
  
const handleJoinGame = () => {
    if (roomId.trim()) {
      // Navigate to the dynamic lobby page with the room ID
      console.log(`Navigating to join room: ${roomId}`);
      router.push('/testpage');
    } else {
      // In a real app, use a custom modal/toast instead of alert
      alert("Please enter a Room ID."); 
    }
  };

  const handleCancelRoom = () => {
    console.log("Navigating to create room page.");
    // Navigate to the separate 'Create a room' page
    router.back();
  };
  

  return (
    <div className="relative mb-4 mx-2">
     {/* Room ID Input */}
      <div className="relative mb-4">
        <Input
          id="room-id"
          placeholder="room ID"
          value={roomId}
          readOnly
          // Custom styling to match the wireframe: white background, larger padding, specific border
          className="w-full py-2 px-4 h-10 text-center font-bold border-2 border-gray-300 rounded-md bg-white placeholder:text-gray-500 focus:border-black text-lg"
        />
      </div>

      <PlayerList players={players} maxPlayers={MAX_PLAYERS} />
      
       {/* <p className="text-gray-600 mb-8 h-6">
        {isRoomFull ? "Room is full!" : `Waiting for ${MAX_PLAYERS - players.length} more player(s)...`}
      </p> */}

    <div className="flex flex-col space-y-4">
        <Button
          variant="join"
          disabled={isLobbyFull}
          className="disabled:bg-[#7D7D7D] disabled:cursor-not-allowed text-white"
          onClick={handleJoinGame}
        >
          Start
        </Button>

        <Button
          variant="cancel"
          className=""
          onClick={handleCancelRoom}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}