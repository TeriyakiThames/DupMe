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

export interface UserSession {
  id: number;
}

export interface UserProfile {
  id: number;
  username: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}

export interface AuthResponse<T = any> {
  success: boolean;
  message: string;
  user?: T;
  error?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse<UserProfile>>;
  register: (userData: CreateUserData) => Promise<AuthResponse<UserProfile>>;
  logout: () => Promise<AuthResponse>;
  checkAuth: () => Promise<void>;
  updateProfile: (updateData: Partial<Pick<UserProfile, 'username'>>) => Promise<AuthResponse<UserProfile>>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}



