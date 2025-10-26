
"use client";

import React, { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  durationSec: number;
  running: boolean;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  durationSec,
  running,
  onComplete,
}) => {
  const [remaining, setRemaining] = useState(durationSec);
  const rafRef = useRef<number | null>(null);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(durationSec);
    endAtRef.current = null;
  }, [durationSec]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return; 
    }

    endAtRef.current = performance.now() + durationSec * 1000;

    const tick = () => {
      const endAt = endAtRef.current!;
      const now = performance.now();
      const msLeft = Math.max(0, endAt - now);
      const secs = Math.ceil(msLeft / 1000);

      setRemaining(secs);

      if (msLeft <= 0) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        onComplete?.();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [running, durationSec, onComplete]);

  return (
    <div className="relative h-16 w-16 select-none">
      <div className="absolute inset-0 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
        {remaining}
        <span className="ml-1 text-[10px]">s.</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
