"use client";

import { BackButton } from '@/components/ui/BackButton';
import { GameHeader } from '@/components/ui/GameHeader';
import { WaitingRoom } from '@/components/ui/WaitingRoom';

export default function Page(){
    return(
        <div className="min-h-screen w-screen bg-gray-50 flex flex-col items-center p-8">
            <div className="w-full absolute top-8 left-0 px-8"> 
                <BackButton />
            </div>
            <div className="w-3/4 max-w-2xl flex flex-col items-center mt-12">
                    
            <GameHeader
                title="Waiting Room"
                subtitle=""
            />
    
            {/* GameCard / Gray Container */}
            <div className="w-full bg-[#e6e6e6] p-8 rounded-xl text-center">
                <h1 className="text-3xl mb-2 text-black font-bold">Here is your room number</h1>
                <p className="text-lg mb-4 text-black">Send the room number to you friend. The game will start once they join!</p>

                {/* Input and interactive buttons are managed inside this WaitingRoom Component */}
                <WaitingRoom />
            </div>
            </div>
        </div> 
    )
}