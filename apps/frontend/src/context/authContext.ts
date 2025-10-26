import type { UserProfile } from "@/types/auth";
import { createContext } from 'react';

export interface AuthContextType {
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

