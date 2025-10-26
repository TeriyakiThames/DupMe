"use client"

import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/authContext';
import * as authClient from '@/lib/authClient';
import type { UserProfile } from '@/types/auth';

export const AuthProvider = ({ children } : { children: React.ReactNode }) => {
  const auth = useProvideAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
  }

function useProvideAuth() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);

  // On mount
  useEffect(() => {
    const fetchProfile = async () => {
      // Set user
      const res = await authClient.getProfile();
      if (res.success) {
        setUserProfile(res.userProfile as UserProfile);
      }
     
    };

    const fetchLeaderBoard = async () => {
      // Fetch leaderboard
      const leaderboardRes = await authClient.getLeaderBoard();
      if (leaderboardRes.success && leaderboardRes.topUsers) {
        setTopUsers(leaderboardRes.topUsers.map(
          (u: UserProfile) => ({
            ...u,
            total_points: u.win_count * 3 + u.draw_count * 1 - u.loss_count * 1
          })
        )); 
      }
    };

    fetchProfile();
    fetchLeaderBoard();

    return () => {
      // Cleanup if needed
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    const res = await authClient.login(username, password);
    setLoading(false);
    if (res.success && res.userProfile) {
      setUserProfile(res.userProfile);
      return { success: true };
    } else {
      setError(res.error || 'Login failed');
      return { success: false, error: res.error };
      
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    const res = await authClient.register(username, password);
    setLoading(false);
    if (res.success && res.userProfile) {
      setUserProfile(res.userProfile);
      return { success: true };
    } else {
      setError(res.error || 'Registration failed');
      return { success: false, error: res.error };
    }
  }, []);

  const logout = useCallback(() => {
    authClient.logout();
    setUserProfile(null);
  }, []);


  return {
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!userProfile,
    topUsers,
  };
}


