import { UserProfile } from "./auth";
import { ServerEventRequest } from "./socket";
import { RoomEventRequest } from "./socketGame";

export interface RoundHeaderProps {
	round?: number;
	subtext: string;
	subtextTone?: "easy" | "danger" | "muted";
}
export const NOTE_LABELS = ["C", "D", "E", "F", "G", "A"] as const;
export type Note = (typeof NOTE_LABELS)[number];
export type Turn = "Create" | "Reproduce";
export type GameMode = "EASY" | "MEDIUM" | "HARD";

export interface PianoProps {
	disabled: boolean;
	onPress: (n: Note) => void;
	orderOverlay?: Record<Note, number[]> | null;
	remoteActiveNotes: Note[];
	livePressVisible?: boolean;
	showIndexAboveOnPress?: boolean;
}


export interface LeaderboardTableProps {
	players: UserProfile[];
	userId?: number;
}

export interface LeaderboardRowProps {
	playerRank: number;
	playerName: string;
	wins: number;
	losses: number;
	draws: number;
	totalPts: number;
	isCurrentUser: boolean;
}

export interface CountdownTimerProps {
  durationSec: number;
  running: boolean;
  onComplete?: () => void;
}

export interface ScorePanelProps {
  title: string;
  playerPoints: Record<string, number>;
  usernameDelta?: [string, number]; 
  align?: "left" | "right";
}

export interface ClientGameComponentProps {
	joinRoom: (data: ServerEventRequest) => unknown;
	getRoomInfo: (data: ServerEventRequest) => unknown;
	isConnected: boolean;
}