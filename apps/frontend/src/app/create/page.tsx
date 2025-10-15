import React from 'react';
import { BackButton } from '@/components/ui/BackButton'; // Ensure you have this icon component
import { GameHeader } from "@/components/ui/GameHeader";
import { RoomCard } from '@/components/ui/RoomCard';

export default function Page() {
  return (
        <div className="min-h-screen w-screen bg-gray-50 flex flex-col items-center p-8"> 
          
          {/* 🛑 BACK BUTTON CONTAINER FIX 🛑 */}
          {/* We make this container full width (w-full) relative to the screen. 
              We use absolute positioning to break it out of the flex centering 
              and position it relative to the top-left corner of the parent div. */}
          <div className="w-full absolute top-8 left-0 px-8"> 
            <BackButton />
          </div>
    
          {/* Main Content Column: Centered on the screen. */}
          <div className="w-3/4 max-w-4xl flex flex-col items-center mt-12">
            
            <GameHeader
              title="Create a Room"
              subtitle=""
            />
    
            {/* GameCard / Gray Container */}
            <div className="w-full bg-[#e6e6e6] p-8 rounded-xl text-center">
              <h2 className="text-2xl font-bold mb-0 text-black">Here is your room number</h2>
              <p className="text-l mb-8 text-black">Send the room number to you friend. The game will start once they join!</p>

              {/* Input and interactive buttons are managed inside this Client Component */}
              <RoomCard />
            </div>
          </div>
        </div>
  )
}