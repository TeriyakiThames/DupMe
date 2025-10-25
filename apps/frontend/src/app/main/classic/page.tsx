"use client";

import { GameHeader } from "@/components/feature/GameHeader";
import { BackButton } from "@/components/ui/BackButton";
import { ClientGameButtons } from "@/components/ui/ClientGameComponent"; 
import { useSocket } from "@/hooks/useSocket";


export default function ClassicGamePage() {
  const socketApi = useSocket();

  return (
    // Outer container: Full screen. Use p-8 for padding on the whole screen.
    // Use items-center to center the main content.
    <div className="min-h-screen w-screen bg-gray-50 flex flex-col items-center p-8"> 
      
      {/* 🛑 BACK BUTTON CONTAINER FIX 🛑 */}
      {/* We make this container full width (w-full) relative to the screen. 
          We use absolute positioning to break it out of the flex centering 
          and position it relative to the top-left corner of the parent div. */}
      <div className="w-full absolute top-8 left-0 px-8"> 
        <BackButton />
      </div>

      {/* Main Content Column: Centered on the screen. */}
      <div className="w-3/4 max-w-2xl flex flex-col items-center mt-12">
        
        <GameHeader
          title="Classic"
          subtitle="Compete against other people!"
        />

        {/* GameCard / Gray Container */}
        <div className="w-full bg-[#e6e6e6] p-8 rounded-xl text-center">
          <h2 className="text-2xl mb-8 text-black">Enter Game</h2>
          
          {/* Input and interactive buttons are managed inside this Client Component */}
          <ClientGameButtons
            joinRoom={socketApi.joinRoom}
            getRoomInfo={socketApi.getRoomInfo}
            isConnected={socketApi.isConnected}
          />
        </div>
      </div>
    </div>
  );
}
