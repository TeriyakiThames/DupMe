"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NOTE_LABELS, Note } from "@/lib/types";
import { classNames } from "@/lib/time";

const KEY_TO_NOTE: Record<string, Note> = {
  a: "C",
  s: "D",
  d: "E",
  f: "F",
  g: "G",
  h: "A",
};

// Preload audio once per note
const audioCache: Partial<Record<Note, HTMLAudioElement>> = {};
function getAudio(note: Note) {
  if (!audioCache[note]) audioCache[note] = new Audio(`/keys/${note}.mp3`);
  return audioCache[note]!;
}

interface PianoProps {
  disabled?: boolean;
  onPress?: (n: Note) => void;

  /** For EASY mode when it's time to replicate: show order numbers on the keys (note -> index 1..N). */
  orderOverlay?: Partial<Record<Note, number>> | null;

  /** List of notes currently pressed by the opponent (from socket). */
  remoteActiveNotes?: Note[];

  /** Whether we should show the opponent’s blue highlight (MEDIUM: true, HARD: false). */
  livePressVisible?: boolean;

  /** If true, show the “index bubble over the key only while it is pressed”. You asked that the number is NOT “when pressed”, so default is false. */
  showIndexAboveOnPress?: boolean;
}

const PianoKey: React.FC<{
  note: Note;
  isActive: boolean; // local or (optionally) remote active highlight
  disabled?: boolean;
  label?: string;
  indexBadge?: number | null; // for EASY overlay numbers
  onDown: (n: Note) => void;
  onUp: (n: Note) => void;
}> = ({ note, isActive, disabled, label, indexBadge, onDown, onUp }) => (
  <button
    aria-label={`Key ${note}`}
    onMouseDown={() => !disabled && onDown(note)}
    onMouseUp={() => !disabled && onUp(note)}
    onMouseLeave={() => !disabled && onUp(note)}
    className={classNames(
      "relative h-48 rounded-lg border text-lg font-semibold transition-all",
      // bigger spacing feel by adding side margins on the key itself
      "mx-1 sm:mx-2",
      // base colors from your palette
      "border-light-grey bg-light-cream hover:bg-pressed active:scale-[0.99]",
      // BLUE only while pressed
      isActive && "!bg-blue-300",
      disabled && "opacity-60 cursor-not-allowed"
    )}
  >
    {/* EASY overlay: persistent 1/2/3… numbers on the key (top center) */}
    {typeof indexBadge === "number" && (
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
        {indexBadge}
      </div>
    )}

    {/* Note label on the key face */}
    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-foreground">
      {label ?? note}
    </span>
  </button>
);

const Piano: React.FC<PianoProps> = ({
  disabled,
  onPress,
  orderOverlay = null,
  remoteActiveNotes = [],
  livePressVisible = true,
  showIndexAboveOnPress = false,
}) => {
  // local active state (this user pressing)
  const [activeLocal, setActiveLocal] = useState<
    Partial<Record<Note, boolean>>
  >({});

  // quick lookup for remote active
  const remoteActiveSet = useMemo(
    () => new Set(remoteActiveNotes),
    [remoteActiveNotes]
  );

  const playSound = useCallback((note: Note) => {
    const audio = getAudio(note);
    audio.currentTime = 0;
    audio.play().catch(() => {}); // ignore autoplay errors
  }, []);

  const handleDown = useCallback(
    (n: Note) => {
      if (disabled) return;
      setActiveLocal((s) => ({ ...s, [n]: true }));
      playSound(n);
      onPress?.(n);
    },
    [disabled, onPress, playSound]
  );

  const handleUp = useCallback((n: Note) => {
    setActiveLocal((s) => ({ ...s, [n]: false }));
  }, []);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const note = KEY_TO_NOTE[e.key.toLowerCase()];
      if (!note || disabled || activeLocal[note]) return;
      setActiveLocal((s) => ({ ...s, [note]: true }));
      playSound(note);
      onPress?.(note);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const note = KEY_TO_NOTE[e.key.toLowerCase()];
      if (!note) return;
      setActiveLocal((s) => ({ ...s, [note]: false }));
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [activeLocal, disabled, onPress, playSound]);

  return (
    <div className="rounded-xl bg-black p-5">
      {/* Larger inter-key spacing */}
      <div className="grid grid-cols-6 gap-6 bg-white p-2 sm:p-3">
        {NOTE_LABELS.map((n) => {
          const isRemoteActive = livePressVisible && remoteActiveSet.has(n);
          const isActive = !!activeLocal[n] || isRemoteActive;

          // For EASY mode, the numbers should show from a parent-supplied map.
          // If you prefer “number only when pressed”, set showIndexAboveOnPress=true and feed the press index in orderOverlay instead.
          const indexNumber =
            orderOverlay && typeof orderOverlay[n] === "number"
              ? (orderOverlay[n] as number)
              : null;

          return (
            <PianoKey
              key={n}
              note={n}
              isActive={isActive}
              disabled={disabled}
              label={n}
              indexBadge={
                showIndexAboveOnPress && !isActive ? null : indexNumber
              }
              onDown={handleDown}
              onUp={handleUp}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Piano;
