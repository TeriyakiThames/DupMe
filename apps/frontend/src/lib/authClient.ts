import axios from 'axios';
import type { AuthResponse, UserResponse } from '@/types/auth';

const URL = process.env.BACKEND_URL || 'https://api.poppoo.xyz' ;
console.log('🖥️ Calling endpoint', URL);

export async function register(username: string, password: string): Promise<AuthResponse> {
  try {
    const res = await axios.post(`${URL}/auth/register`, { username, password }, { withCredentials: true });
    const data = res.data;
    return { success: data.success, message: data.message, userProfile: data.user };
  } catch (err : unknown) {
    if (axios.isAxiosError(err)) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
    return { success: false, error: 'Registration failed' };
  }
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  try {
    const res = await axios.post(`${URL}/auth/login`, { username, password }, { withCredentials: true });
    const data = res.data;
    return { success: data.success, message: data.message, userProfile: data.user };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
    return { success: false, error: 'Login failed' };
  }
}

export async function getProfile() : Promise<AuthResponse> {
    try {
        const res = await axios.get(`${URL}/auth/me`, { withCredentials: true });
        const data = res.data;
        return { success: true, message: data.message, userProfile: data.user };

    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            return { success: false, error: err.response?.data?.error || 'Failed to fetch profile' };
        }
        return { success: false, error: 'Failed to fetch profile' };
    }
}

export async function logout(): Promise<AuthResponse> {
    try {
        const res = await axios.post(`${URL}/auth/logout`, {}, { withCredentials: true });
        const data = res.data;
        return { success: data.success, message: data.message };

    } catch (err : unknown) {
        console.error('Logout failed', err);
        if (axios.isAxiosError(err)) {
            return { success: false, error: err.response?.data?.error || 'Logout failed' };
        }
        return { success: false, error: 'Logout failed' };
    }
}

export async function getLeaderBoard() : Promise<UserResponse> {
    try {
        const res = await axios.get(`${URL}/users`);
        const data = res.data;
        const topUsers = data.users
        return {
            success: data.success,
            message: data.message,
            topUsers
        };
    } catch (error : unknown) {
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch leaderboard'
            };
        }

        return { success: false, error: 'Failed to fetch leaderboard' };
    }
}


