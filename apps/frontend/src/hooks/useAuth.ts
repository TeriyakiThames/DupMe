// useAuth.ts
// React hook for authentication state and actions

import { useState, useEffect, useCallback } from 'react';
import * as authClient from '../lib/authClient';
import { UserProfile } from '../types/auth';


export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);

  // On mount
  useEffect(() => {
    const fetchProfile = async () => {
      // Set user
      const res = await authClient.getProfile();
      if (res.success) {
        setUser(res.user as UserProfile);
      }
     
    };

    const fetchLeaderBoard = async () => {
      // Fetch leaderboard
      const leaderboardRes = await authClient.getLeaderBoard();
      if (leaderboardRes.success && leaderboardRes.topUsers) {
        setTopUsers(leaderboardRes.topUsers.map(
          (u: any) => ({
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
    if (res.success && res.user) {
      setUser(res.user);
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
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    } else {
      setError(res.error || 'Registration failed');
      return { success: false, error: res.error };
    }
  }, []);

  const logout = useCallback(() => {
    authClient.logout();
    setUser(null);
  }, []);


  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    topUsers,
  };
}
