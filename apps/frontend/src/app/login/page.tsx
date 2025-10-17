'use client';

import React, { useState, useEffect } from 'react';
import LogoHeader from '@/components/ui/logo/dupMe';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';


import { useAuth } from '@/hooks/useAuth';

// OnlinePlayers now uses useSocket to get online users
const OnlinePlayers = () => {
  const { socket, isConnected } = useSocket();
  const [onlinePlayers, setOnlinePlayers] = useState<{ id: number; username: string }[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for online-players event
    const handler = (players: any[]) => {
      setOnlinePlayers(players);
    };
    socket.on('online-players', handler);

    // Request online players on mount
    socket.emit('get-online-players');

    // Optionally, poll every 30s
    const interval = setInterval(() => {
      socket.emit('get-online-players');
    }, 30000);

    return () => {
      socket.off('online-players', handler);
      clearInterval(interval);
    };
  }, [socket, isConnected]);

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
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState<null | {
    totalRooms: number;
    activeRooms: number;
    totalUsers: number;
    emptyRooms: number;
  }>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Request stats on mount
    socket.emit('get-stats');

    // Listen for server-stats
    const handler = (data: any) => {
      setStats(data);
    };
    socket.on('server-stats', handler);

    // Optionally, request stats every 30s
    const interval = setInterval(() => {
      socket.emit('get-stats');
    }, 30000);

    return () => {
      socket.off('server-stats', handler);
      clearInterval(interval);
    };
  }, [socket, isConnected]);

  return (
    <main className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
      {/* --- MODIFIED: The main container box to match the Game Mode page --- */}
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-4xl">
        <div className="flex items-center mb-8">
          <LogoHeader />
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col items-center md:items-start gap-4">
            <OnlinePlayers />
            {/* Server Stats Display */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 w-full max-w-xs mt-4">
              <h3 className="text-sm text-gray-700 text-center mb-2 font-medium">Server Stats</h3>
              {stats ? (
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>Total Rooms: <span className="font-semibold">{stats.totalRooms}</span></li>
                  <li>Active Rooms: <span className="font-semibold">{stats.activeRooms}</span></li>
                  <li>Total Users: <span className="font-semibold">{stats.totalUsers}</span></li>
                  <li>Empty Rooms: <span className="font-semibold">{stats.emptyRooms}</span></li>
                </ul>
              ) : (
                <div className="text-gray-400 text-center">Loading stats...</div>
              )}
            </div>
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