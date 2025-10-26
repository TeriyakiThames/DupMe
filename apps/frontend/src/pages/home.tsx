'use client';

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LogoHeader from '@/components/ui/dupMe';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import type { ServerEventBroadcast } from '@/types/socket';

interface Stats {
    totalRooms: number;
    activeRooms: number;
    totalUsers: number;
    onlineUsers: Set<string>;
    emptyRooms: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);
  const [stats, setStats] = useState<null | Stats>(null);
  
  const { userProfile : user } = useAuth();
  const socketApi = useSocket();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleServersStats = (data: ServerEventBroadcast ) => {
    const stats = data as Stats; 
    setStats(stats);
    setOnlinePlayers(Array.from(stats.onlineUsers));
  }
 
  useEffect(() => {
    
    if (!socketApi || !user) return;
    socketApi.onRoomEvent('server-stats', handleServersStats);
    socketApi.getServerStats();

    const interval = setInterval(() => {
      socketApi.getServerStats();
    }, 30000);

    return () => {
      socketApi.offRoomEvent('server-stats', handleServersStats);
      clearInterval(interval);
    };
  }, [socketApi, user]);

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'} flex items-center justify-center p-4`}>
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-lg p-12 w-full max-w-4xl`}>
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

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col items-center md:items-start gap-4">
            <h3 className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-center mb-3`}>
              {stats ? `👥 ${stats.totalUsers} Users Online • 🏠 ${stats.totalRooms} Rooms (${stats.activeRooms} Active, ${stats.emptyRooms} Empty)` : 'Loading stats...'}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {onlinePlayers.length > 0 ? (
                onlinePlayers.map((usr) => (
                  <div key={usr} className="bg-gray-400 text-white px-4 py-2 rounded">
                    {usr}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center">No players online.</div>
              )}
            </div>
            
          </div>
          {/* Menu Buttons Section */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/main/play')}
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              ▶ Play
            </button>
            <button
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => navigate('/main/leaderboard')}
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
