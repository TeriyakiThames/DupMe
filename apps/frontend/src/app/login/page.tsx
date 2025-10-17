'use client';


import React, { useState } from 'react';
import LogoHeader from '@/components/ui/logo/dupMe';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login({ username, password });
    } else {
      await register({ username, password });
    }
    // On success, redirect to home
    router.push('/');
  };

  return (
    <main className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-md">
        <div className="flex items-center mb-8 justify-center">
          <LogoHeader />
        </div>
        <h3 className="text-xl font-semibold text-black mb-4 text-center">
          {mode === 'login' ? 'Login to DupMe' : 'Register for DupMe'}
        </h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-300 rounded p-2 text-red-800 text-sm">
              {error}
              <button onClick={clearError} className="ml-2 text-red-600 hover:text-red-800">×</button>
            </div>
          )}
          <input
            type="text"
            placeholder="Username"
            className="w-full bg-gray-100 border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-black"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-gray-100 border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-black"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-black text-white px-4 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? (mode === 'login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Register')}
          </button>
        </form>
        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setMode('register')}>
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setMode('login')}>
                Login
              </button>
            </span>
          )}
        </div>
      </div>
    </main>
  );
}