import { create } from "zustand";
import type { Note, GameMode } from "@/lib/types";

interface PlayerState {
  userName: string;
  points: number;
}

interface GameState {
  roomCode: string;
  mode: GameMode;
  round: number;
  turn: "Create" | "Reproduce";
  me: PlayerState;
  opponent: PlayerState;
  remoteActiveNotes: Note[];
  orderOverlay: Partial<Record<Note, number>> | null;
  running: boolean;

  // Actions
  setMode: (m: GameMode) => void;
  setTurn: (t: "Create" | "Reproduce") => void;
  setRemoteNotes: (notes: Note[]) => void;
  setOrderOverlay: (map: Partial<Record<Note, number>> | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomCode: "",
  mode: "EASY",
  round: 1,
  turn: "Create",
  me: { userName: "You", points: 0 },
  opponent: { userName: "Opponent", points: 0 },
  remoteActiveNotes: [],
  orderOverlay: null,
  running: false,

  setMode: (m) => set({ mode: m }),
  setTurn: (t) => set({ turn: t }),
  setRemoteNotes: (n) => set({ remoteActiveNotes: n }),
  setOrderOverlay: (m) => set({ orderOverlay: m }),
}));
