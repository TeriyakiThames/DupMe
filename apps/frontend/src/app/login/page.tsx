'use client';

import React, { useState, useEffect } from 'react';
import LogoHeader from '@/components/ui/logo/dupMe';
import { useRouter } from 'next/navigation';

// --- DEFINE PLAYER TYPE ---
type Player = {
  id: number;
  username: string;
};

// --- DUMMY DATA ---
const dummyPlayers: Player[] = [
  { id: 1, username: 'user 1' },
  { id: 2, username: 'user 2' },
  { id: 3, username: 'user 3' },
  { id: 4, username: 'user 4' },
  { id: 5, username: 'user 5' },
  { id: 6, username: 'user 6' },
  { id: 7, username: 'user 7' },
];

const OnlinePlayers = () => {
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);

  useEffect(() => {
    setOnlinePlayers(dummyPlayers);
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-md border border-gray-200 w-full max-w-xs">
      <h3 className="text-sm text-gray-700 text-center mb-3 font-medium">
        🟢 Online Players
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
        {onlinePlayers.length > 0 ? (
          onlinePlayers.map((player) => (
            <div
              key={player.id}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              {player.username}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No players online.</p>
        )}
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  return (
    <main className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
      {/* --- MODIFIED: The main container box to match the Game Mode page --- */}
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-4xl">
        
        <div className="flex items-center mb-8">
          <LogoHeader />
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="flex justify-center md:justify-start">
            <OnlinePlayers />
          </div>
          <div className="w-full max-w-xs justify-self-center md:justify-self-start">
            <h3 className="text-xl font-semibold text-black mb-4">Enter Your Username</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="username" 
                className="w-full bg-gray-100 border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-black" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push('/');
                  }
                }}
              />
              <button 
                className="w-full bg-black text-white px-4 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                onClick={() => router.push('/')}

              >
                Enter
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}