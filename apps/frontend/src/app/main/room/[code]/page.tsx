import React, { useMemo, useState, useEffect, use } from "react";
import ScorePanel from "@/components/feature/ScorePanel";
import RoundHeader from "@/components/feature/RoundHeader";
import CountdownTimer from "@/components/feature/CountdownTimer";
import Piano from "@/components/feature/Piano";
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import type { Note, GameMode } from "@/types/components";
import { RoomEventBroadcast, RoomEventRequest, RoomEventResponse } from "@/types/socketGame";
import { UserProfile } from "@/types/auth";

export default function GamePage() {
  const { user, loading } = useAuth();
  const {isConnected, onRoomEvent, 
          offRoomEvent, onGameEvent, offGameEvent,
          getRoomInfo, saveSequence, submitRoundResult, 
          getGameState
   } = useSocket(
      process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL_LOCAL as string,
      user
  );

  // State variables
  const [roomId, setRoomId] = useState<string>(""); 
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [delta, setDelta] = useState<[string, number]>();
  const [gameState, setGameState] = useState<any>(null);
  const [mySeq, setMySeq] = useState<Note[]>([]);
  const [seq, SetSeq] = useState<Note[]>([]);
  const [iAmActing, setIAmActing] = useState<boolean>(false);

  const [mode, setMode] = useState<GameMode>("EASY");
  const [turn, setTurn] = useState<'Create' | 'Reproduce'>("Create");

  const [duration, setDuration] = useState(20);
  const [running, setRunning] = useState(true);

  const [headerSubtext, setHeaderSubtext] = useState("");
  const [subtextTone, setSubtextTone] = useState<'easy' | 'danger' | 'muted'>("muted");

  const [remoteActiveNotes, setRemoteActiveNotes] = useState<Note[]>([]);
  

  const handleRoomInfo = (data : RoomEventBroadcast) => setRoomId(data.roomId as string);
  const handleGameState = (data : RoomEventBroadcast) => {
    setGameState(data);
    if (data.usernameDelta) setDelta(data.usernameDelta);
    if (data.playerPoints) setPlayerPoints(data.playerPoints);
    if (data.gameState?.questionPlayer) setTurn(data.gameState.questionPlayer.id === user?.id ? "Create" : "Reproduce");
    setIAmActing(turn === "Create");
  }
  const handleSequenceReceived = (data : RoomEventBroadcast) => {
    setMySeq([]);
    setIAmActing(turn === "Create");
    SetSeq(data.sequence as Note[]);
  }
  const handleRoundUpdated = (data : RoomEventBroadcast) => {
    const gameEnded = data.gameEnded;
    if (gameEnded) {
      // TODO: Navigate to results page
    } else {
      handleGameState(data);
    }
  }
  const handleSaveSequence = () => {
    if (!isConnected || !user) return;
    saveSequence({ user, sequence: mySeq });
  }
  const handleSubmitRoundResult = () => {
    if (!isConnected || !user) return;
    let pointsEarned = 0;
    for (let i = 0; i < seq.length; i++) {
      if (i < mySeq.length) {
        if (mySeq[i] === seq[i]) pointsEarned++;
      }
    }
    submitRoundResult({ user, pointsEarned });
  }
  const handleSubmitOrSave = () => {
    if (turn === "Create") handleSaveSequence();
    else handleSubmitRoundResult();
  }

  // Piano expects onPress: (n: string) => void
  const onPianoPress = (n: string) => {
    if (!isConnected) return;
    setMySeq((seq) => [...seq, n as Note]);
  };

  useEffect(() => {
  if (!isConnected || !user) return;

    onRoomEvent('room-info', handleRoomInfo);
    getRoomInfo(user);

    onRoomEvent('game-state', handleGameState);
    getGameState(user);


    return () => {
      offRoomEvent('room-info', handleRoomInfo);
      offRoomEvent('game-state', handleGameState);  
    };
  }, [isConnected, user]);

  useEffect(() => {
  if (!isConnected || !user) return;
    onGameEvent('round-updated', handleRoundUpdated);
    onGameEvent('sequence-received', handleSequenceReceived);

    return () => {
      offGameEvent('round-updated', handleRoundUpdated);
      offGameEvent('sequence-received', handleSequenceReceived);
    };
  }, []);

  useEffect(() => {
  if (mySeq.length === 7) {
    handleSubmitOrSave();
  }
  }, [mySeq]);

  // orderOverlay: { [note: string]: number[] }
  const orderOverlay = useMemo(() => {
    if (mode !== "EASY") return null;
    if (turn !== "Reproduce") return null;
    if (!seq.length) return null;
    const base: Record<Note, number[]> = { C: [], D: [], E: [], F: [], G: [], A: [] };
    return seq.reduce(
      (acc, n, i) => {
        acc[n].push(i + 1);
        return acc;
      },
      base
    );
  }, [mode, turn, seq]);
  const livePressVisible = mode !== "HARD";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-screen flex-col gap-6 p-6 bg-white">
      {/* Top bar */}
      <div className="grid grid-cols-3 items-end">
        <ScorePanel title="You" playerPoints={Object.fromEntries(Object.entries(playerPoints).filter(([k, v])=> k === user?.username))} usernameDelta={delta} />
        <div className="flex flex-col items-center justify-center gap-4">
          <RoundHeader
            round={gameState.turnCount}
            subtext={headerSubtext}
            subtextTone={subtextTone}
          />
          <CountdownTimer
            durationSec={duration}
            running={running}
            onComplete={() => {setRunning(false); handleSubmitOrSave();}}
          />
        </div>
        <ScorePanel
          title="Opponents"
          playerPoints={Object.fromEntries(Object.entries(playerPoints).filter(([k, v])=> k !== user?.username))}
          usernameDelta={delta}
          align="right"
        />
      </div>

      {/* Piano */}
      <Piano
        disabled={!running || !iAmActing}
        onPress={onPianoPress}
        orderOverlay={orderOverlay}
        remoteActiveNotes={remoteActiveNotes as Note[]}
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

