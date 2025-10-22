// // app/room/[code]/page.tsx
// "use client";
// import React, { useMemo, useState } from "react";
// import ScorePanel from "@/components/feature/ScorePanel";
// import RoundHeader from "@/components/feature/RoundHeader";
// import CountdownTimer from "@/components/feature/CountdownTimer";
// import Piano from "@/components/feature/Piano";
// import { NOTE_LABELS, type Note, type GameMode } from "@/types/components";

// // Helper: build {note -> first index} map for EASY overlay
// function buildOrderOverlay(seq: Note[]) {
//   return seq.reduce(
//     (acc, n, i) => {
//       if (acc[n] == null) acc[n] = i + 1; // only first occurrence
//       return acc;
//     },
//     {} as Partial<Record<Note, number>>
//   );
// }

// // Helper: random opponent sequence (3–6 notes)
// function randomSequence(): Note[] {
//   const len = Math.floor(Math.random() * 4) + 3; // 3..6
//   const seq: Note[] = [];
//   for (let i = 0; i < len; i++) {
//     const n = NOTE_LABELS[Math.floor(Math.random() * NOTE_LABELS.length)];
//     seq.push(n);
//   }
//   return seq;
// }

// export default function GamePage() {
//   // Static demo values
//   const me = { userName: "You", points: 100 };
//   const opponent = { userName: "Your Opponent", points: 100 };

//   // Choose a mode; EASY shows order numbers on keys, MEDIUM/HARD hide them
//   const [mode] = useState<GameMode>("EASY"); // change manually if you want: "MEDIUM" | "HARD"

//   // Generate a random opponent sequence once
//   const opponentSeq = useMemo(() => randomSequence(), []);
//   const orderOverlay = useMemo(
//     () => (mode === "EASY" ? buildOrderOverlay(opponentSeq) : null),
//     [mode, opponentSeq]
//   );

//   // Static timer (runs forever for the demo)
//   const round = 1;
//   const duration = 20;
//   const running = true;

//   // Static header
//   const headerSubtext = "Your Turn";
//   const subtextTone = "easy" as const;

//   // Piano is always enabled in this static demo
//   const iAmActing = true;

//   // No remote presses in the static version
//   const remoteActiveNotes: Note[] = [];
//   const livePressVisible = mode !== "HARD"; // MEDIUM/EASY would show blue if there were remote presses

//   // The Piano already plays sound on press internally; no need to handle onPress.
//   const onPianoPress = (n: Note) => {
//     // Intentionally empty for static demo
//     // (Piano itself plays /keys/${note}.mp3 and highlights the key.)
//     console.log("Pressed", n);
//   };

//   return (
//     <div className="mx-auto flex min-h-[100dvh] w-screen flex-col gap-6 p-6 bg-white">
//       {/* Top bar */}
//       <div className="grid grid-cols-3 items-end">
//         <ScorePanel title="You" points={me.points} delta={0} />
//         <div className="flex flex-col items-center justify-center gap-4">
//           <RoundHeader
//             round={round}
//             subtext={headerSubtext}
//             subtextTone={subtextTone}
//           />
//           <CountdownTimer durationSec={duration} running={running} />
//         </div>
//         <ScorePanel
//           title="Your Opponent"
//           points={opponent.points}
//           delta={0}
//           align="right"
//         />
//       </div>

//       {/* Piano */}
//       <Piano
//         disabled={!iAmActing ? true : false}
//         onPress={onPianoPress}
//         orderOverlay={orderOverlay} // EASY shows 1/2/3…; MEDIUM/HARD pass null
//         remoteActiveNotes={remoteActiveNotes} // none in static demo
//         livePressVisible={livePressVisible} // irrelevant here but kept for parity
//         showIndexAboveOnPress={false}
//       />

//       {/* Footer helpers */}
//       <div className="flex items-center justify-between text-xs text-dark-grey">
//         <div>Keyboard: A S D F G H → C D E F G A</div>
//         <div className="flex items-center gap-2">
//           <span className="rounded border border-light-grey px-2 py-0.5 text-foreground">
//             {mode}
//           </span>
//         </div>
//       </div>

//       {/* Show the generated opponent sequence (for reference in this static demo) */}
//       <div className="mt-2 text-xs text-dark-grey">
//         Opponent sequence (demo):{" "}
//         <span className="font-mono">{opponentSeq.join(" , ")}</span>
//       </div>
//     </div>
//   );
// }
