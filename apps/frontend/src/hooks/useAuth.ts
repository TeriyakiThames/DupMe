'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient } from '../lib/authClient';
import { UserProfile, 
        CreateUserData, 
        LoginCredentials, 
        AuthResponse, 
        AuthState, 
        UseAuthReturn } from '../types/user';


export function useAuth(options: {
  autoCheck?: boolean;
  onAuthChange?: (user: UserProfile | null) => void;
} = {}): UseAuthReturn {
  const { autoCheck = true, onAuthChange } = options;

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Update authentication state
  const updateAuthState = useCallback((
    user: UserProfile | null,
    isLoading: boolean = false,
    error: string | null = null
  ) => {
    const isAuthenticated = user !== null;
    
    setState({
      user,
      isAuthenticated,
      isLoading,
      error,
    });

    // Call auth change callback if provided
    if (onAuthChange) {
      onAuthChange(user);
    }
  }, [onAuthChange]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authClient.checkAuth();
      
      if (result.success && result.user) {
        updateAuthState(result.user, false);
      } else {
        updateAuthState(null, false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      updateAuthState(null, false, 'Failed to check authentication status');
    }
  }, [updateAuthState]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse<UserProfile>> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authClient.login(credentials);
      
      if (result.success && result.user) {
        updateAuthState(result.user, false);
      } else {
        updateAuthState(null, false, result.message || 'Login failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      updateAuthState(null, false, errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [updateAuthState]);

  // Register function
  const register = useCallback(async (userData: CreateUserData): Promise<AuthResponse<UserProfile>> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authClient.register(userData);
      
      if (result.success && result.user) {
        updateAuthState(result.user, false);
      } else {
        updateAuthState(null, false, result.message || 'Registration failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      updateAuthState(null, false, errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [updateAuthState]);

  // Logout function
  const logout = useCallback(async (): Promise<AuthResponse> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authClient.logout();
      
      // Always clear local state, even if server logout fails
      updateAuthState(null, false);
      
      return result;
    } catch (error) {
      // Clear local state even on error
      updateAuthState(null, false, 'Logout may have failed, but you have been logged out locally');
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [updateAuthState]);

  // Update profile function
  const updateProfile = useCallback(async (
    updateData: Partial<Pick<UserProfile, 'username'>>
  ): Promise<AuthResponse<UserProfile>> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authClient.updateProfile(updateData);
      
      if (result.success && result.user) {
        updateAuthState(result.user, false);
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.message || 'Profile update failed' 
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [updateAuthState]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await authClient.getCurrentUserProfile();
      
      if (result.success && result.user) {
        updateAuthState(result.user, false);
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.message || 'Failed to refresh profile' 
        }));
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to refresh profile' 
      }));
    }
  }, [updateAuthState]);

  // Initialize authentication on mount
  useEffect(() => {
    if (autoCheck) {
      checkAuth();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [autoCheck, checkAuth]);

  // Sync with authClient's current user state
  useEffect(() => {
    const currentUser = authClient.getCurrentUser();
    if (currentUser && !state.user) {
      updateAuthState(currentUser, false);
    }
  }, [state.user, updateAuthState]);

  return {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Methods
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    clearError,
    refreshProfile,
  };
}


export default useAuth;
