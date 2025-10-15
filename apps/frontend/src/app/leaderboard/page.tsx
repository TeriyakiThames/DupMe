'use client';

import React from "react"; 
import { BackButton } from "@/components/ui/BackButton";
import { GameHeader } from "@/components/ui/GameHeader";
import LeaderboardTable from "@/components/ui/LeaderboardTable";  

export default function Page(){
    const players = [
        { name: "Touch", wins: 10, losses: 1, draws: 1, totalPts: 1100 },
        { name: "Prashil", wins: 8, losses: 3, draws: 2, totalPts: 1000 },
        { name: "Sachhyam", wins: 6, losses: 5, draws: 4, totalPts: 900, isCurrentUser: true }, // Example current user
        { name: "Theme", wins: 3, losses: 6, draws: 6, totalPts: 950 },
        { name: "Thames", wins: 1, losses: 8, draws: 7, totalPts: 950 },
    ];

    // Sort players by totalPts in descending order
    const sortedPlayers = [...players].sort((a, b) => b.totalPts - a.totalPts);

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
                  title="Leaderboard"
                  subtitle=""
                />
        
                {/* GameCard / Gray Container */}
                <div className="w-full bg-[#e6e6e6] p-8 rounded-xl text-center">
                    <LeaderboardTable players={sortedPlayers} />
                </div>
              </div>
            </div>
            )
}