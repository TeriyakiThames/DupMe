"use client";

import React from 'react';

// Define the shape of a player object for type safety
interface Player {
  id: number;
  name: string;
  isHost: boolean;
}

interface PlayerListProps {
  players: Player[];
  maxPlayers: number;
}

/**
 * A component to display the list of players in the waiting room.
 * It shows filled slots for joined players and empty slots for others.
 */
export function PlayerList({ players, maxPlayers }: PlayerListProps) {
  return (
    <div className="w-full bg-white p-4 rounded-lg border-3 border-gray-300 relative mb-4 hover:border-black transition-colors">
      {/* Player Count in the top-right corner */}
      <div className="absolute top-2 right-4 text-sm text-gray-500 font-medium">
        {players.length}/{maxPlayers}
      </div>

      {/* List container */}
      <div className="flex flex-col gap-2 mt-6">
        {/* Create a slot for each possible player */}
        {Array.from({ length: maxPlayers }).map((_, index) => {
          const player = players[index];
          return (
            <div
              key={index}
              className={`p-3 rounded-md text-left ${
                player 
                  ? 'bg-[#FFF1B1] text-black' 
                  : 'bg-[#E6E6E6] text-gray-500 border border-dashed border-gray-400'
              }`}
            >
              {player ? player.name : 'Empty'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
