export interface CreateUserData {
  username: string;
  password: string;

}

export interface LoginCredentials {
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

export interface UserProfile {
  id: number;
  username: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
  total_points?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  userProfile?: UserProfile;
  error?: string;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  topUsers?: UserProfile[];
  error?: string;
}

export interface AuthState {
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: CreateUserData) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  checkAuth: () => Promise<void>;
  updateProfile: (updateData: Partial<Pick<UserProfile, 'username'>>) => Promise<AuthResponse>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}



