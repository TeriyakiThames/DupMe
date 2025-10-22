import React from 'react';
import LeaderboardRow from './LeaderboardRow';
import type {  LeaderboardTableProps } from '@/types/components';
import { UserProfile } from '@/types/auth';

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ players, userId }) => {
  return (
    <div className="w-full rounded-xl">
      <div className="grid grid-cols-5 gap-4 py-3 px-2 mb-2 border-b-2 border-gray-300 text-black-600 font-bold text-lg whitespace-nowrap">
        <div>Player Name</div>
        <div className="text-center">Win</div>
        <div className="text-center">Loss</div>
        <div className="text-center">Draw</div>
        <div className="text-center">Total pts</div>
      </div>
      <div className="space-y-3">
        {players.map((player : UserProfile, index : number) => (
          <LeaderboardRow
            key={player.id}
            playerRank={index + 1}
            playerName={player.username}
            wins={player.win_count}
            losses={player.loss_count}
            draws={player.draw_count}
            totalPts={player.total_points as number}
            isCurrentUser={player.id === userId}
          />
        ))}
      </div>
    </div>
  );
};

export default LeaderboardTable;
