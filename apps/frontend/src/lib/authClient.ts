import { UserProfile, CreateUserData, LoginCredentials, AuthResponse  } from '../types/user';

export class AuthClient {
  private baseUrl: string;
  private currentUser: UserProfile | null = null;

  constructor(baseUrl: string = process.env.BACKEND_URL || 'http://localhost:4000') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Test connectivity to the backend
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔍 Testing connection to:', `${this.baseUrl}/`);
      
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      return {
        success: true,
        message: 'Backend connection successful',
        details: {
          status: response.status,
          data: data
        }
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        message: 'Cannot connect to backend',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: this.baseUrl
        }
      };
    }
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUserData): Promise<AuthResponse<User>> {
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
  async login(credentials: LoginCredentials): Promise<AuthResponse<UserProfile>> {
    try {
      console.log('🔐 Attempting login to:', `${this.baseUrl}/api/auth/login`);
      console.log('🌐 Using baseUrl:', this.baseUrl);
      console.log('📝 Login credentials:', { username: credentials.username, password: '[HIDDEN]' });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(credentials),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Login response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Login request failed:', response.status, errorText);
        return {
          success: false,
          message: `Server error: ${response.status} ${response.statusText}`,
          error: errorText,
        };
      }

      const result = await response.json();
      console.log('📋 Login result:', { success: result.success, message: result.message });

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
      console.error('❌ Network error during login:', error);
      console.log('🔗 Current baseUrl:', this.baseUrl);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Login request timed out. Please check your connection and try again.',
          error: 'Request timeout',
        };
      }
      
      if (error instanceof TypeError) {
        if (error.message.includes('Failed to fetch')) {
          return {
            success: false,
            message: 'Cannot connect to server. Please check:\n1. Backend is running\n2. Dev tunnel is active\n3. URL is correct\n4. Accept any SSL certificate warnings',
            error: `Connection failed to: ${this.baseUrl}`,
          };
        }
        
        if (error.message.includes('NetworkError')) {
          return {
            success: false,
            message: 'Network error. Please check your internet connection and try again.',
            error: error.message,
          };
        }
      }
      
      return {
        success: false,
        message: 'Network error during login',
        error: error instanceof Error ? error.message : 'Unknown network error',
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
  async checkAuth(): Promise<AuthResponse<UserProfile>> {
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
  async getCurrentUserProfile(): Promise<AuthResponse<UserProfile>> {
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
  async updateProfile(updateData: Partial<Pick<UserProfile, 'username'>>): Promise<AuthResponse<UserProfile>> {
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
  getCurrentUser(): UserProfile| null {
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
  async initialize(): Promise<UserProfile | null> {
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