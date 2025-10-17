// components/LeaderboardRow.tsx
import React from 'react';
import clsx from 'clsx'; // For conditionally joining class names

interface LeaderboardRowProps {
  playerRank: number; // 1, 2, 3, etc.
  playerName: string;
  wins: number;
  losses: number;
  draws: number;
  totalPts: number;
  isCurrentUser?: boolean; // To highlight the current user if needed
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  playerRank,
  playerName,
  wins,
  losses,
  draws,
  totalPts,
  isCurrentUser = false,
}) => {
  // Define base classes for all rows
  const baseRowClasses = 'grid grid-cols-5 gap-5 items-center py-3 px-4 text-black-800 text-lg whitespace-nowrap';

  // Define unique styles for top ranks using a blue/purple/pink scheme
  let rankSpecificClasses = '';
  let medalIcon = null;
  let totalPtsBg = 'bg-gray-200'; // Default for non-top ranks

  if (playerRank === 1) {
    rankSpecificClasses = 'bg-blue-100 font-semibold rounded-lg '; // Light blue
    medalIcon = <span className="text-2xl mr-1">🥇</span>;
    totalPtsBg = 'bg-blue-300 text-blue-900 font-bold rounded-md px-3 py-1';
  } else if (playerRank === 2) {
    rankSpecificClasses = 'bg-purple-100 font-medium rounded-lg'; // Light purple
    medalIcon = <span className="text-2xl mr-1">🥈</span>;
    totalPtsBg = 'bg-purple-300 text-purple-900 font-bold rounded-md px-3 py-1';
  } else if (playerRank === 3) {
    rankSpecificClasses = 'bg-pink-100 font-medium rounded-lg'; // Light pink
    medalIcon = <span className="text-2xl mr-1">🥉</span>;
    totalPtsBg = 'bg-pink-300 text-pink-900 font-bold rounded-md px-3 py-1';
  } else {
    rankSpecificClasses = 'border-t border-gray-200'; // Separator for other rows
  }

  // Highlight current user with a border, regardless of rank
  const currentUserHighlight = isCurrentUser ? '' : '';

  return (
    <div className={clsx(baseRowClasses, rankSpecificClasses, currentUserHighlight)}>
      <div className="flex items-center">
        {medalIcon}
        <span>{playerName}</span>
      </div>
      <div className="text-center">{wins}</div>
      <div className="text-center">{losses}</div>
      <div className="text-center">{draws}</div>
      <div className="text-center">
        <span className={totalPtsBg}>{totalPts} pts</span>
      </div>
    </div>
  );
};

export default LeaderboardRow;