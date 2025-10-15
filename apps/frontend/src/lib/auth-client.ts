interface User {
  id: number;
  username: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
  is_active: boolean;
}

interface AuthResponse<T = any> {
  success: boolean;
  message: string;
  user?: T;
  error?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
}

export class AuthClient {
  private baseUrl: string;
  private currentUser: User | null = null;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success && result.user) {
        // Get full user profile after registration
        const profileResult = await this.getCurrentUserProfile();
        if (profileResult.success && profileResult.user) {
          this.currentUser = profileResult.user;
          return {
            success: true,
            message: result.message,
            user: profileResult.user,
          };
        }
      }

      return {
        success: false,
        message: result.message || 'Registration failed',
        error: result.message,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error during registration',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success && result.user) {
        // Get full user profile after login
        const profileResult = await this.getCurrentUserProfile();
        if (profileResult.success && profileResult.user) {
          this.currentUser = profileResult.user;
          return {
            success: true,
            message: result.message,
            user: profileResult.user,
          };
        }
      }

      return {
        success: false,
        message: result.message || 'Login failed',
        error: result.message,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error during login',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = null;
      }

      return result;
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Network error during logout',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth(): Promise<AuthResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/check`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.isAuthenticated && result.user) {
        // Get full user profile if authenticated
        const profileResult = await this.getCurrentUserProfile();
        if (profileResult.success && profileResult.user) {
          this.currentUser = profileResult.user;
          return {
            success: true,
            message: 'User is authenticated',
            user: profileResult.user,
          };
        }
      }

      this.currentUser = null;
      return {
        success: false,
        message: 'User is not authenticated',
      };
    } catch (error) {
      console.error('Auth check error:', error);
      this.currentUser = null;
      return {
        success: false,
        message: 'Network error during authentication check',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current user profile (with full data)
   */
  async getCurrentUserProfile(): Promise<AuthResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.user) {
        this.currentUser = result.user;
      }

      return result;
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Network error while fetching profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updateData: Partial<Pick<User, 'username'>>): Promise<AuthResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success && result.user) {
        this.currentUser = result.user;
      }

      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Network error while updating profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current user (from local cache)
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated (local check)
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Initialize auth state (check if user is already logged in)
   */
  async initialize(): Promise<User | null> {
    const authResult = await this.checkAuth();
    return authResult.success && authResult.user ? authResult.user : null;
  }

  /**
   * Get user ID as string (for socket connection)
   */
  getUserId(): string | null {
    return this.currentUser ? this.currentUser.id.toString() : null;
  }
}

// Create singleton instance
export const authClient = new AuthClient();

// Export default instance for easy importing
export default authClient;