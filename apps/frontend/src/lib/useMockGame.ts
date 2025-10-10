// lib/useMockGame.ts
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gameService } from "@/lib/api/gameService";
import type { Note, Turn } from "@/lib/types";

type Player = { userName: string; points: number };

export function useMockGame(roomId: string, me: Player, opponent: Player) {
  // game state
  const [round, setRound] = useState(1); // 1..2
  const [turn, setTurn] = useState<Turn>("Create"); // Create | Reproduce (for the CURRENT player)
  const [running, setRunning] = useState(false); // timer running?

  // who goes first (server decides in startGame)
  const [firstPlayer, setFirstPlayer] = useState<Player | null>(null);

  // am I acting now?
  const iAmActing = useMemo(() => {
    if (!firstPlayer) return false;
    // round 1: first acts; round 1 turn order: first Create, other Reproduce
    // round 2: swapped role
    const firstCreatesThisRound = round === 1;
    const actingUser =
      turn === "Create"
        ? firstCreatesThisRound
          ? firstPlayer
          : firstPlayer.userName === me.userName
            ? opponent
            : me
        : firstCreatesThisRound
          ? firstPlayer.userName === me.userName
            ? opponent
            : me
          : firstPlayer;
    return actingUser.userName === me.userName;
  }, [firstPlayer, round, turn, me, opponent]);

  // local score deltas (to show +10 in UI)
  const [meDelta, setMeDelta] = useState(0);
  const [oppDelta, setOppDelta] = useState(0);

  // pattern buffers
  const creatorSeqRef = useRef<string[]>([]);
  const reproCorrectCountRef = useRef(0);

  // a simple id for each half-turn (useful for logs & server calls)
  const turnId = useMemo(
    () => `r${round}-${turn.toLowerCase()}`,
    [round, turn]
  );

  // derived labels
  const duration = turn === "Create" ? 10 : 20;
  const headerSubtext = iAmActing
    ? turn === "Create"
      ? "Your Turn"
      : "Your Turn"
    : "Wait for them";
  const subtextTone = iAmActing ? "easy" : "danger";

  /** boot game: ask server to start & who goes first */
  const startGame = useCallback(async () => {
    const res = await gameService.startGame(roomId, [me, opponent]);
    setFirstPlayer(res.firstPlayer);
    // The first server turn is always Create for the first player
    setRound(1);
    setTurn("Create");
  }, [roomId, me, opponent]);

  /** start a specific turn on the server (tells us the timer) */
  const startTurn = useCallback(async () => {
    const role: "creator" | "follower" =
      turn === "Create" ? "creator" : "follower";
    await gameService.startTurn(turnId, role);
    // reset local buffers
    creatorSeqRef.current = [];
    reproCorrectCountRef.current = 0;
    // run timer
    setRunning(true);
  }, [turn, turnId]);

  /** creator presses a key */
  const onCreatorPress = useCallback((n: Note) => {
    creatorSeqRef.current.push(n);
  }, []);

  /** follower presses a key (ask server to check) */
  const onFollowerPress = useCallback(
    async (n: Note) => {
      const res = await gameService.checkPattern(roomId, turnId, n);
      if (res.correct)
        reproCorrectCountRef.current =
          res.nextIndex ?? reproCorrectCountRef.current;
      // If done (matched all) we can end the turn early
      if (res.done) {
        setRunning(false);
        await onTimerComplete();
      }
    },
    [roomId, turnId]
  );

  /** called when the countdown circle completes (or follower finished early) */
  const onTimerComplete = useCallback(async () => {
    setRunning(false);

    // CREATOR → save pattern & hand over to follower
    if (turn === "Create") {
      await gameService.savePattern(roomId, turnId, creatorSeqRef.current);
      setTurn("Reproduce");
      // follower turn starts
      setTimeout(startTurn, 50);
      return;
    }

    // FOLLOWER → compute earned points = longest correct prefix
    const earned = reproCorrectCountRef.current;

    // bump deltas for UI
    if (iAmActing) setMeDelta((d) => d + earned);
    else setOppDelta((d) => d + earned);

    // round 1: after follower ends, go next round (creator switches)
    if (round === 1) {
      setRound(2);
      setTurn("Create");
      setTimeout(startTurn, 50);
    } else {
      // round 2 over → end match
      const p1Score = meDelta + (iAmActing ? earned : 0);
      const p2Score = oppDelta + (!iAmActing ? earned : 0);
      const winner =
        p1Score === p2Score
          ? "TIE"
          : p1Score > p2Score
            ? me.userName
            : opponent.userName;

      await gameService.saveMatchResult(
        roomId,
        me.userName,
        opponent.userName,
        p1Score,
        p2Score,
        winner
      );
      await gameService.endGame(
        roomId,
        { [me.userName]: p1Score, [opponent.userName]: p2Score },
        winner
      );

      // optional: update persistent totals (mocked)
      if (winner !== "TIE") {
        await gameService.increasePoint(winner, 1); // example small award
      }
    }
  }, [
    turn,
    roomId,
    turnId,
    round,
    iAmActing,
    meDelta,
    oppDelta,
    me.userName,
    opponent.userName,
    startTurn,
  ]);

  /** outward API for the page */
  useEffect(() => {
    startGame().then(() => startTurn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // UI state
    round,
    turn,
    duration,
    running,
    headerSubtext,
    subtextTone: subtextTone as "easy" | "danger",
    meDelta,
    oppDelta,

    // Piano wiring
    iAmActing,
    onCreatorPress,
    onFollowerPress,

    // Timer
    onTimerComplete,

    // helpers
    setRunning,
  };
}
