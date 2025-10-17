// CountdownTimer types
export interface CountdownTimerProps {
  durationSec: number;
  running: boolean;
  onComplete?: () => void;
}

// Piano types
export interface PianoProps {
  disabled?: boolean;
  onPress?: (n: string) => void;
  orderOverlay?: Partial<Record<string, number>> | null;
  remoteActiveNotes?: string[];
  livePressVisible?: boolean;
  showIndexAboveOnPress?: boolean;
}

// RoundHeader types
export interface RoundHeaderProps {
  round: number;
  subtext: string;
  subtextTone?: "easy" | "danger" | "muted";
}

// ScorePanel types
export interface ScorePanelProps {
  title: string;
  points: number;
  delta?: number;
  align?: "left" | "right";
}
