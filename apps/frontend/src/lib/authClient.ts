// authClient.ts
// Handles authentication API requests and token management
import axios from 'axios';
import { AuthResponse, UserResponse } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL_LOCAL;
console.log('🖥️ Calling endpoint', API_URL);

export async function register(username: string, password: string): Promise<AuthResponse> {
  try {
    const res = await axios.post(`${API_URL}/api/auth/register`, { username, password }, { withCredentials: true });
    const data = res.data;
    return { success: data.success, message: data.message, userProfile: data.user };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || 'Registration failed' };
  }
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  try {
    const res = await axios.post(`${API_URL}/api/auth/login`, { username, password }, { withCredentials: true });
    const data = res.data;
    return { success: data.success, message: data.message, userProfile: data.user };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error || 'Login failed' };
  }
}

export async function getProfile() : Promise<AuthResponse> {
    try {
        const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
        const data = res.data;
        return { success: true, message: data.message, userProfile: data.user };

    } catch (err: any) {
        return { success: false, error: err.response?.data?.error || 'Failed to fetch profile' };
    }
}

export async function logout(): Promise<AuthResponse> {
    try {
        const res = await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
        const data = res.data;
        return { success: data.success, message: data.message };

    } catch (err : any) {
        console.error('Logout failed', err);
        return { success: false, error: err.response?.data?.error || 'Logout failed' }; 
    }
}

export async function getLeaderBoard() : Promise<UserResponse> {
    try {
        const res = await axios.get(`${API_URL}/api/users`);
        const data = res.data;
        const topUsers = data.users
        return {
            success: data.success,
            message: data.message,
            topUsers
        };
    } catch (error) {
        return {
            success: false,
            error: 'Failed to fetch leaderboard'
        }
    }
}


