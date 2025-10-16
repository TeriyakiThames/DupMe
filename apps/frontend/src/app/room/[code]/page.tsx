"use client";
import React, { useMemo, useState } from "react";
import ScorePanel from "@/components/ScorePanel";
import RoundHeader from "@/components/RoundHeader";
import CountdownTimer from "@/components/CountdownTimer";
import Piano from "@/components/Piano";
import { useMockGame } from "@/lib/useMockGame";
import type { Note, GameMode } from "@/lib/types";

export default function GamePage() {
  // pretend these come from auth/route params/etc.
  const roomId = "room-abc";
  const me = { userName: "You", points: 100 };
  const opponent = { userName: "Your Opponent", points: 100 };

  // Room mode (server will set this later via socket; for now it’s local UI)
  const [mode] = useState<GameMode>("EASY"); // "EASY" | "MEDIUM" | "HARD"

  const {
    round,
    turn,
    duration,
    running,
    headerSubtext,
    subtextTone,
    meDelta,
    oppDelta,
    iAmActing,
    onCreatorPress,
    onFollowerPress,
    onTimerComplete,
    setRunning,

    // Optional: expose the last created pattern from the mock hook (if you added it).
    // If your current useMockGame doesn’t expose this, replace with an empty array ([])
    // and you’ll still be able to plug the real pattern in once sockets are ready.
    // recordedPattern,
  } = useMockGame(roomId, me, opponent);

  // ************* When sockets are live, replace with notes reported by the opponent’s `note:down/up`.
  const remoteActiveNotes: Note[] = []; // ← wire to socket later *************

  // EASY overlay: show order numbers to the replicating player.
  // If you expose a `recordedPattern` array from `useMockGame` (the creator’s final sequence),
  // build the overlay map here. For now, we’ll just leave it null.
  const recordedPattern: Note[] = []; //***************** */ ← replace with hook/sockets later
  const orderOverlay = useMemo(() => {
    if (mode !== "EASY") return null;
    // Show order only when *replicating* (not while someone is creating).
    if (turn !== "Reproduce") return null;
    if (!recordedPattern.length) return null;

    return recordedPattern.reduce(
      (acc, n, i) => {
        // only set first occurrence index (1-based)
        if (acc[n] == null) acc[n] = i + 1;
        return acc;
      },
      {} as Partial<Record<Note, number>>
    );
  }, [mode, turn, recordedPattern]);

  const livePressVisible = mode !== "HARD"; // MEDIUM/EASY show blue on remote press; HARD hides it

  const onPianoPress = (n: Note) => {
    if (!iAmActing) return; // locked when not your turn
    if (turn === "Create") onCreatorPress(n);
    else onFollowerPress(n);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-screen flex-col gap-6 p-6 bg-white">
      {/* Top bar */}
      <div className="grid grid-cols-3 items-end">
        <ScorePanel title="You" points={me.points} delta={meDelta} />
        <div className="flex flex-col items-center justify-center gap-4">
          <RoundHeader
            round={round}
            subtext={headerSubtext}
            subtextTone={subtextTone}
          />
          <CountdownTimer
            durationSec={duration}
            running={running}
            onComplete={onTimerComplete}
          />
        </div>
        <ScorePanel
          title="Your Opponent"
          points={opponent.points}
          delta={oppDelta}
          align="right"
        />
      </div>

      {/* Piano */}
      <Piano
        disabled={!running || !iAmActing}
        onPress={onPianoPress}
        // When creating, we don’t show numbers. When replicating in EASY, overlay is computed above.
        orderOverlay={orderOverlay}
        // Show opponent’s live blue presses in MEDIUM/EASY; hide in HARD.
        remoteActiveNotes={remoteActiveNotes}
        livePressVisible={livePressVisible}
        // You asked that the number is NOT “when pressed”, so keep this false.
        showIndexAboveOnPress={false}
      />

      {/* Footer helpers */}
      <div className="flex items-center justify-between text-xs text-dark-grey">
        <div>Keyboard: A S D F G H → C D E F G A</div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-light-grey px-2 py-0.5 text-foreground">
            {mode}
          </span>
          <button
            className="rounded-md border border-light-grey px-3 py-1 font-medium text-foreground hover:bg-pressed"
            onClick={() => setRunning((s) => !s)}
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
