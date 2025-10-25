export interface CreateUserData {
  username: string;
  password: string;
}

export interface LoginCredentials {
  username: string; 
  password: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}


export interface UpdateUserData {
  username?: string;
  win_count?: number;
  loss_count?: number;
  draw_count?: number;
  is_active?: boolean;
}


export interface UserProfile {
  id: number;
  username: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}

