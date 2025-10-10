import React from "react";
import Link from "next/link";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: string; // emoji or icon string
  href: string;
  bgColor?: string; // optional Tailwind background class
  textColor?: string; // optional Tailwind text color class
}

const GameModeCard: React.FC<GameModeCardProps> = ({
  title,
  description,
  icon,
  href,
  bgColor = "bg-gray-100",
  textColor = "text-black",
}) => {
  return (
    <Link href={href}>
      <div
        className={`rounded-2xl p-8 w-72 h-72 flex flex-col items-center justify-center 
                    shadow-md cursor-pointer transform transition-all duration-300 
                    hover:scale-105 hover:shadow-xl ${bgColor} ${textColor}`}
      >
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <span className="text-6xl mb-4">{icon}</span>
        <p className="text-center text-sm opacity-80">{description}</p>
      </div>
    </Link>
  );
};

export default GameModeCard;
