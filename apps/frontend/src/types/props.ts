export const NOTE_LABELS = ["C", "D", "E", "F", "G", "A"] as const;
export type Note = (typeof NOTE_LABELS)[number];
export type Turn = "Create" | "Reproduce";
export type GameMode = "EASY" | "MEDIUM" | "HARD";
