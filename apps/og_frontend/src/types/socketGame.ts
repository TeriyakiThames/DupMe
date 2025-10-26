import {UserProfile} from './auth';
import { GameMode, Note } from './components';

export interface GameState {
  currentPattern: string[];         // pattern created by questionPlayer
  questionPlayer?: UserProfile;      // player who creates the pattern
  answerPlayers?: UserProfile[];     // players who answer the pattern
  turnCount: number;                // number of turns taken
  roundNumber: number;               // current round number
  isGameActive: boolean;             // whether game is currently active
  lastSequenceTime?: Date;           // timestamp of last sequence save
  questionPlayerIndex: number;       // index of the current question player
}

export interface RoomEventRequest {
  userProfile: UserProfile;
  sequence?: string[];
  pointsEarned?: number;
}

export interface RoomEventResponse {
    success: boolean;
    roomId?: string;
    message: string;
    sequenceLength?: number;
    gameState?: GameState;
    usernameDelta?: [string, number]; 
    playerPoints?: Record<string, number>;
}

export interface RoomEventBroadcast {
    success: boolean;
    message: string;
    sequence?: Note[];
    roomId?: string;
    gameState?: GameState;
    roundNumber?: number;
    gameEnded?: boolean;
    playerPoints?: Record<string, number>;
    winner?: UserProfile;
    usernameDelta?: [string, number]; 
}


