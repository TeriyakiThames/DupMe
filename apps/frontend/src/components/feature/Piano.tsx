"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NOTE_LABELS, Note, PianoProps } from "@/types/components";
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

const PianoKey: React.FC<{
  note: Note;
  isActive: boolean;
  disabled?: boolean;
  label?: string;
  indexBadges?: number[] | null; // for EASY overlay numbers (multiple)
  onDown: (n: Note) => void;
  onUp: (n: Note) => void;
}> = ({ note, isActive, disabled, label, indexBadges, onDown, onUp }) => (
  <button
    aria-label={`Key ${note}`}
    onMouseDown={() => !disabled && onDown(note)}
    onMouseUp={() => !disabled && onUp(note)}
    onMouseLeave={() => !disabled && onUp(note)}
    className={classNames(
      "relative bg-white h-100 rounded-lg border text-lg font-semibold transition-all",
      "mx-1 sm:mx-2",
      "border-light-grey bg-white hover:bg-pressed active:scale-[0.99]",
      isActive && "!bg-pressed",
      disabled && "opacity-100 cursor-not-allowed"
    )}
  >
    {/* EASY overlay: persistent 1/2/3… numbers on the key (top center) */}
    {Array.isArray(indexBadges) && indexBadges.length > 0 && (
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-row gap-1">
        {indexBadges.map((idx) => (
          <span
            key={idx}
            className="rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background"
          >
            {idx}
          </span>
        ))}
      </div>
    )}

    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-black">
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
      <div className="grid grid-cols-6 gap-6 bg-black p-2 sm:p-3">
        {NOTE_LABELS.map((n) => {
          const isRemoteActive = livePressVisible && remoteActiveSet.has(n);
          const isActive = !!activeLocal[n] || isRemoteActive;

          // For EASY mode, the numbers should show from a parent-supplied map.
          // Now supports multiple indices per note.
          const indexBadges =
            orderOverlay && Array.isArray(orderOverlay[n])
              ? (orderOverlay[n] as number[])
              : null;

          return (
            <PianoKey
              key={n}
              note={n}
              isActive={isActive}
              disabled={disabled}
              label={n}
              indexBadges={
                showIndexAboveOnPress && !isActive ? null : indexBadges
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
