import { UserProfile } from './user';

export interface GameState {
  currentPattern: string[];          // pattern created by questionPlayer
  questionPlayer?: UserProfile;      // player who creates the pattern
  answerPlayer?: UserProfile;        // player who answers the pattern
  turnCounts: number;                // number of turns taken
  roundNumber: number;               // current round number
  isGameActive: boolean;             // whether game is currently active
  lastSequenceTime?: Date;           // timestamp of last sequence save
}