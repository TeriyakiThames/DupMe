// components/LeaderboardTable.tsx
import React from 'react';
import LeaderboardRow from './LeaderboardRow';

// Define an interface for player data
interface PlayerData {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalPts: number;
  isCurrentUser?: boolean;
}

interface LeaderboardTableProps {
  players: PlayerData[];
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ players }) => {
  return (
    <div className="w-full rounded-xl">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 py-3 px-2 mb-2 border-b-2 border-gray-300 text-black-600 font-bold text-lg whitespace-nowrap">
        <div>Player Name</div>
        <div className="text-center">Win</div>
        <div className="text-center">Loss</div>
        <div className="text-center">Draw</div>
        <div className="text-center">Total pts</div>
      </div>

      {/* Leaderboard Rows */}
      <div className="space-y-3"> {/* Adds space between rows */}
        {players.map((player, index) => (
          <LeaderboardRow
            key={player.name} // Player name as key, assuming unique
            playerRank={index + 1}
            playerName={player.name}
            wins={player.wins}
            losses={player.losses}
            draws={player.draws}
            totalPts={player.totalPts}
            isCurrentUser={player.isCurrentUser}
          />
        ))}
      </div>
    </div>
  );
};

export default LeaderboardTable;