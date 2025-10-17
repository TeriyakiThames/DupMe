
import React, { useMemo, useState, useEffect } from "react";
import ScorePanel from "@/components/ScorePanel";
import RoundHeader from "@/components/RoundHeader";
import CountdownTimer from "@/components/CountdownTimer";
import Piano from "@/components/Piano";
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import type { Note, GameMode } from "../../../types/game";

export default function GamePage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  // These would come from socket/game state
  const [roomId, setRoomId] = useState<string>("");
  const [me, setMe] = useState<{ userName: string; points: number }>({ userName: user?.username || "Me", points: 0 });
  const [opponent, setOpponent] = useState<{ userName: string; points: number }>({ userName: "Opponent", points: 0 });
  const [mode, setMode] = useState<GameMode>("EASY");
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<'Create' | 'Reproduce'>("Create");
  const [duration, setDuration] = useState(20);
  const [running, setRunning] = useState(true);
  const [headerSubtext, setHeaderSubtext] = useState("");
  const [subtextTone, setSubtextTone] = useState<'easy' | 'danger' | 'muted'>("muted");
  const [meDelta, setMeDelta] = useState<number>(0);
  const [oppDelta, setOppDelta] = useState<number>(0);
  const [iAmActing, setIAmActing] = useState(true);
  const [remoteActiveNotes, setRemoteActiveNotes] = useState<Note[]>([]);
  const [recordedPattern, setRecordedPattern] = useState<Note[]>([]);

  // Example: Listen for game state from socket
  useEffect(() => {
    if (!socket || !isConnected) return;
    // TODO: Listen for real game state events and update state accordingly
    // socket.on('game-state', (data) => { ... });
    // socket.on('remote-note', (notes) => setRemoteActiveNotes(notes));
    // socket.emit('get-game-state', { roomId });
    // For now, just set roomId from URL if available
    // ...existing code...
  }, [socket, isConnected]);

  const orderOverlay = useMemo(() => {
    if (mode !== "EASY") return null;
    if (turn !== "Reproduce") return null;
    if (!recordedPattern.length) return null;
    return recordedPattern.reduce(
      (acc, n, i) => {
        if (acc[n] == null) acc[n] = i + 1;
        return acc;
      },
      {} as Partial<Record<Note, number>>
    );
  }, [mode, turn, recordedPattern]);

  const livePressVisible = mode !== "HARD";


  // Piano expects onPress: (n: string) => void
  const onPianoPress = (n: string) => {
    if (!iAmActing) return;
    if (!socket || !isConnected) return;
    socket.emit('note-press', { roomId, note: n });
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
            onComplete={() => setRunning(false)}
          />
        </div>
        <ScorePanel
          title="Opponent"
          points={opponent.points}
          delta={oppDelta}
          align="right"
        />
      </div>

      {/* Piano */}
      <Piano
        disabled={!running || !iAmActing}
        onPress={onPianoPress}
        orderOverlay={orderOverlay}
        remoteActiveNotes={remoteActiveNotes as string[]}
        livePressVisible={livePressVisible}
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
