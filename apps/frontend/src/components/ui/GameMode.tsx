"use client";
import React from 'react';
import clsx from 'clsx';

// Define the types for the component's props
interface GameModeProps {
  level: string;
  emoji: string;
  descriptionLines: string[];
  color: 'green' | 'yellow' | 'red'; // Use specific color names
  onClick?: () => void;
}

/**
 * A component to display a game mode selection button, styled with Tailwind CSS.
 * @param {string} level - The difficulty level text (e.g., "Easy").
 * @param {string} emoji - The emoji to display next to the level.
 * @param {string[]} descriptionLines - An array of strings for the description text.
 * @param {'green' | 'yellow' | 'red'} color - The base color theme for the button.
 * @param {() => void} [onClick] - Optional function to run when the button is clicked.
 */

export const GameMode: React.FC<GameModeProps> = ({ level, emoji, descriptionLines, color, onClick }) => {
  // --- STYLES ---
  // Map prop colors to specific Tailwind CSS classes for background colors
  // Using arbitrary values to match the exact hex codes from your image.
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
    colorVariants[color] // Apply the color from the map
  );

  return (
    <button className={buttonClasses} onClick={onClick}>
      <div className="text-2xl font-bold mb-2">
        {level} {emoji}
      </div>
      <p className="text-base leading-snug">
        {/* Map over the description lines and add a line break */}
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
