import { create } from 'zustand';
import { api } from '@/lib/api';

export type UserRole = 'STUDENT' | 'WARDEN' | 'CHIEF_WARDEN' | 'HOSTEL_ADMIN' | 'SYSADMIN';

export interface AuthUser {
  _id: string;
  registrationNumber: string;
  email: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  role: UserRole;
  isAccessibleNeed?: boolean;
  department?: string;
  yearOfStudy?: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hostel_token', token);
    }
    set({ user, token, isHydrated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hostel_token');
    }
    set({ user: null, token: null, isHydrated: true });
  },

  hydrate: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('hostel_token');
    if (!token) {
      set({ user: null, token: null, isHydrated: true });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data.user, token, isHydrated: true });
    } catch {
      localStorage.removeItem('hostel_token');
      set({ user: null, token: null, isHydrated: true });
    }
  },
}));
