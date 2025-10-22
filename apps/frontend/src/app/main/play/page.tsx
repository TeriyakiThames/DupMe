'use client';

import { useRouter } from 'next/navigation';
import GameModeCard from '@/components/ui/GameModeCard';

export default function PlayPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* --- MODIFIED: Added this white box container --- */}
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-4xl">
        
        {/* Header */}
        <div className="relative flex justify-center items-center mb-12">
          <button
            onClick={() => router.back()}
            // Positioned button to the left edge of the new white box
            className="absolute left-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer"
          >
            &lt; back
          </button>
          <h1 className="text-5xl font-bold italic text-black">
            Game Mode
          </h1>
        </div>

        {/* Game Mode Cards */}
        <div className="flex flex-row justify-center items-center gap-10">
          <GameModeCard
            title="Multiplayer"
            description="play against real people and test out your skill"
            icon="👥"
            href="multiplayer"
            bgColor="bg-black"
            textColor="text-white"
          />
          
          <GameModeCard
            title="Practice"
            description="sharpen your skills against our bot"
            icon="🎯"
            href="practice"
            bgColor="bg-gray-200"
            textColor="text-black"
          />
        </div>

      </div>
    </div>
  );
}