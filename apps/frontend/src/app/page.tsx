'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoHeader from '@/components/ui/logo/dupMe';

export default function HomePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  type Player = {
    id: number;
    username: string;
  };

  const dummyPlayers: Player[] = [
    { id: 1, username: 'user 1' },
    { id: 2, username: 'user 2' },
    { id: 3, username: 'user 3' },
    { id: 4, username: 'user 4' },
    { id: 5, username: 'user 5' },
    { id: 6, username: 'user 6' },
    { id: 7, username: 'user 7' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'} flex items-center justify-center p-4`}>
      {/* --- MODIFIED: The main container box --- */}
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-lg p-12 w-full max-w-4xl`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LogoHeader />
          </div>
          <button
            onClick={toggleTheme}
            className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} hover:text-gray-800 transition-colors cursor-pointer`}
          >
            {theme === 'light' ? '☀️ Light Theme' : '🌙 Dark Theme'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Online Players Section */}
          <div>
            <h3 className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-center mb-3`}>
              🟢 Online Players
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {dummyPlayers.map((player) => (
                <div key={player.id} className="bg-gray-400 text-white px-4 py-2 rounded">
                  {player.username}
                </div>
              ))}
            </div>
          </div>

          {/* Menu Buttons Section */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push('/play')}
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              ▶ Play
            </button>
            <button
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => router.push('/leaderboard')}
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}