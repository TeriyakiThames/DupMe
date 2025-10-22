'use client';

import React from "react"; 
import { BackButton } from "@/components/ui/BackButton";
import { GameHeader } from "@/components/feature/GameHeader";
import LeaderboardTable from "@/components/feature/LeaderboardTable";  
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const { user, loading: authLoading, topUsers } = useAuth();

  return (
    <div className="min-h-screen w-screen bg-gray-50 flex flex-col items-center p-8 text-black">
      {/* 🛑 BACK BUTTON CONTAINER FIX 🛑 */}
      <div className="w-full absolute top-8 left-0 px-8">
        <BackButton />
      </div>

      {/* Main Content Column: Centered on the screen. */}
      <div className="w-3/4 max-w-4xl flex flex-col items-center mt-12">
        <GameHeader title="Leaderboard" subtitle="" />
        {/* GameCard / Gray Container */}
        <div className="w-full bg-[#e6e6e6] p-8 rounded-xl text-center">
          {authLoading ? (
            <div className="text-gray-400">Loading leaderboard...</div>
          ) : (
            <LeaderboardTable players={topUsers} userId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
}