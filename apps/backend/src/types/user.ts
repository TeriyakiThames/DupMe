export interface User {
  id: number;
  username: string;
  password_hash: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}

export interface CreateUserData {
  username: string;
  password: string;

}

export interface UpdateUserData {
  username?: string;
  win_count?: number;
  loss_count?: number;
  draw_count?: number;
  is_active?: boolean;
}

export interface LoginCredentials {
  username: string; 
  password: string;
}



export interface UserProfile {
  id: number;
  username: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}

// extends express session interface
declare module 'express-session' {
  interface SessionData {
    user?: UserProfile;
    isAuthenticated?: boolean;
  }
}