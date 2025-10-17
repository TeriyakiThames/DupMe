import { SocketResponse } from "./socket"; 

export interface GamePlayer {
  userName: string;
  points: number;
}

export const NOTE_LABELS = ["C", "D", "E", "F", "G", "A"] as const;

export type Note = (typeof NOTE_LABELS)[number];

export type Turn = "Create" | "Reproduce";

export type GameMode = "EASY" | "MEDIUM" | "HARD";


export interface GameServiceResponse<T = any> extends SocketResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StartGameResponse {
  roomId: string;
  firstPlayer: GamePlayer;
  message: string;
  gameMode?: GameMode;
  players?: GamePlayer[];
}

export interface StartTurnResponse {
  turnId: string;
  role: "creator" | "follower";
  duration: number;
  message: string;
  turn?: "Create" | "Reproduce";
}

export interface SavePatternResponse {
  success: boolean;
  length: number;
  pattern?: Note[];
}

export interface CheckPatternResponse {
  correct: boolean;
  nextIndex: number;
  done: boolean;
  expectedNote?: Note;
  actualNote?: Note;
}

export interface EndGameResponse {
  message: string;
  leaderboard: Array<{ user: string; pts: number }>;
  winner: string;
  finalScores: Record<string, number>;
}
