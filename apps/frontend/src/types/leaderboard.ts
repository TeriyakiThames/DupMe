// Leaderboard types
export interface PlayerData {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalPts: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardTableProps {
  players: PlayerData[];
}

export interface LeaderboardRowProps {
  playerRank: number;
  playerName: string;
  wins: number;
  losses: number;
  draws: number;
  totalPts: number;
  isCurrentUser?: boolean;
}
