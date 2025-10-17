
"use client";
import React from "react";
import type { RoundHeaderProps } from "@/types/components";

const toneToClass: Record<
  NonNullable<RoundHeaderProps["subtextTone"]>,
  string
> = {
  easy: "text-easy",
  danger: "text-dark-red",
  muted: "text-dark-grey",
};

const RoundHeader: React.FC<RoundHeaderProps> = ({
  round,
  subtext,
  subtextTone = "muted",
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm tracking-wide text-black font-bold">
        ROUND {round}
      </div>
      <div className={`text-lg font-semibold ${toneToClass[subtextTone]}`}>
        {subtext}
      </div>
    </div>
  );
};

export default RoundHeader;
