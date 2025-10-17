'use client';

import React from "react"; 
import { BackButton } from "@/components/ui/BackButton";
import { GameHeader } from "@/components/ui/GameHeader";
import LeaderboardTable from "@/components/ui/LeaderboardTable";  

import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState } from 'react';

export default function Page() {
  const { socket, isConnected } = useSocket();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !isConnected) return;
    setLoading(true);
    const handler = (data: any[]) => {
      setPlayers(data);
      setLoading(false);
    };
    socket.on('leaderboard', handler);
    socket.emit('get-leaderboard');
    return () => {
      socket.off('leaderboard', handler);
    };
  }, [socket, isConnected]);

  // Sort players by totalPts in descending order
  const sortedPlayers = [...players].sort((a, b) => b.totalPts - a.totalPts);

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
          {loading ? (
            <div className="text-gray-400">Loading leaderboard...</div>
          ) : (
            <LeaderboardTable players={sortedPlayers} />
          )}
        </div>
      </div>
    </div>
  );
}