"use client";
import React from "react";

interface ScorePanelProps {
  title: string; // "You" / "Your Opponent"
  points: number; // base points
  delta?: number; // e.g., +10 (optional)
  align?: "left" | "right";
}

const ScorePanel: React.FC<ScorePanelProps> = ({
  title,
  points,
  delta,
  align = "left",
}) => {
  return (
    <div
      className={`flex flex-col gap-1 ${align === "right" ? "items-end" : "items-start"}`}
    >
      <div className="text-base font-semibold text-black">{title}</div>
      <div className="text-sm text-black">
        <span className="font-semibold">{points}</span>
        {typeof delta === "number" && delta !== 0 && (
          <span
            className={`ml-1 font-semibold ${delta > 0 ? "text-dark-red" : "text-dark-red"}`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
        <span className="ml-1">Pts.</span>
      </div>
    </div>
  );
};

export default ScorePanel;
