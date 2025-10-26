"use client";
import React from 'react';
import clsx from 'clsx';

interface GameModeProps {
  level: string;
  emoji: string;
  descriptionLines: string[];
  color: 'green' | 'yellow' | 'red';
  onClick?: () => void;
}

export const GameMode: React.FC<GameModeProps> = ({ level, emoji, descriptionLines, color, onClick }) => {
  const colorVariants = {
    green: 'bg-[#6A8D65] hover:bg-[#5f7d5a]',
    yellow: 'bg-[#B9A043] hover:bg-[#a6903c]',
    red: 'bg-[#A85B5B] hover:bg-[#975151]',
  };
  const buttonClasses = clsx(
    'w-full',
    'p-5',
    'rounded-xl',
    'text-white',
    'font-sans',
    'text-center',
    'cursor-pointer',
    'transition-all',
    'duration-200',
    'ease-in-out',
    'transform',
    'hover:scale-105',
    colorVariants[color]
  );
  return (
    <button className={buttonClasses} onClick={onClick}>
      <div className="text-2xl font-bold mb-2">
        {level} {emoji}
      </div>
      <p className="text-base leading-snug">
        {descriptionLines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < descriptionLines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    </button>
  );
};
