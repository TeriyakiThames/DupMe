"use client"
// useAuth.ts
// React hook for authentication state and actions


import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import * as authClient from '../lib/authClient';
import { UserProfile } from '../types/auth';


interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  topUsers: UserProfile[];
}

export const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider = ({ children } : { children: React.ReactNode }) => {
  const auth = useProvideAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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


