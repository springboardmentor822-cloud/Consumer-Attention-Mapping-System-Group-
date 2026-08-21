import { create } from 'zustand';
import { Role, UserProfile } from '../types';
import { api } from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const roleDefaultUsers: Record<Role, UserProfile> = {
  STORE_MANAGER: {
    id: 'USR-001',
    email: 'manager@retail.com',
    full_name: 'Lathashree',
    role: 'STORE_MANAGER',
    store_id: 'STORE-812'
  },
  RETAIL_ANALYST: {
    id: 'USR-002',
    email: 'analyst@retail.com',
    full_name: 'Vivek Prasad',
    role: 'RETAIL_ANALYST',
    store_id: 'STORE-812'
  },
  MARKETING_MANAGER: {
    id: 'USR-003',
    email: 'marketing@retail.com',
    full_name: 'Monika',
    role: 'MARKETING_MANAGER',
    store_id: 'STORE-812'
  },
  ADMINISTRATOR: {
    id: 'USR-004',
    email: 'admin@retail.com',
    full_name: 'Parvathraj',
    role: 'ADMINISTRATOR',
    store_id: 'STORE-812'
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  // App starts directly on Login Page first (unauthenticated by default)
  isAuthenticated: false,
  token: null,
  user: null,

  login: async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      if (res && res.access_token) {
        set({
          isAuthenticated: true,
          token: res.access_token,
          user: res.user
        });
        return true;
      }
    } catch (e) {
      console.error('Login authentication error:', e);
    }
    return false;
  },

  logout: () => {
    set({
      isAuthenticated: false,
      token: null,
      user: null
    });
  }
}));
