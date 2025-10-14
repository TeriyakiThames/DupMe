'use client';

import React from "react"; 
import { BackButton } from "@/components/ui/BackButton";
import { GameHeader } from "@/components/ui/GameHeader";
import { GameMode }from "@/components/ui/GameMode";    

export default function Page(){
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
              <div className="w-[550px] max-w-full flex flex-col items-center mt-12">
                
                <GameHeader
                  title="Multiplayer"
                  subtitle=""
                />
        
                {/* GameCard / Gray Container */}
                <div className="w-full bg-[#e6e6e6] p-8 rounded-xl text-center">
                  <h2 className="text-2xl font-bold mb-0 text-black">Classic</h2>
    
                  {/* Input and interactive buttons are managed inside this Client Component */}
                  <div className = "md:space-y-6 mt-6">
                    <GameMode
                        level="Easy"
                        emoji="😌"
                        descriptionLines={['Hear the sound,', 'See the notes,', 'No need to remember']}
                        color="green"
                        onClick={() => console.log('Easy mode selected!')}
                    />

                    <GameMode
                        level="Medium"
                        emoji="😏"
                        descriptionLines={['Hear the sound,', 'See the notes,', 'Please do remember!']}
                        color="yellow"
                        onClick={() => alert('Medium mode selected!')}
                    />

                    <GameMode
                        level="Hard"
                        emoji="💀"
                        descriptionLines={['Pitch Perfect!']}
                        color="red"
                        onClick={() => alert('Hard mode selected!')}
                    />
                  </div>
                </div>
              </div>
            </div>
            )
}