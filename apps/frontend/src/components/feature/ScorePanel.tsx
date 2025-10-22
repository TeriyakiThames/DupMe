
"use client";
import React from "react";
import { ScorePanelProps } from "@/types/components";


const ScorePanel: React.FC<ScorePanelProps> = ({ title, playerPoints, usernameDelta, align = "left" }) => {
  return (
    <div className={`flex flex-row gap-1 ${align === "right" ? "items-end" : "items-start"}`}>
      {Object.entries(playerPoints).map(([username, points]) => {
        const isDelta = usernameDelta && username === usernameDelta[0];
        return (
          <div key={username} className="text-sm text-black flex flex-row items-center">
            <div className="text-base font-semibold text-black">{title}</div>
              <span className="font-semibold mr-2">{username}</span>
              <span className="font-semibold">{points}</span>
            {isDelta && usernameDelta[1] !== 0 && (
              <span className={`ml-1 font-semibold text-dark-red`}>
                {usernameDelta[1] > 0 ? `+${usernameDelta[1]}` : usernameDelta[1]}
              </span>
            )}
            <span className="ml-1">Pts.</span>
          </div>
        );
      })}
    </div>
  );
}

export default ScorePanel;