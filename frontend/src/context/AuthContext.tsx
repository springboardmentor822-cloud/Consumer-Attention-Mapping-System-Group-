'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, full_name: string, role: string, password: string) => Promise<void>;
  getAuthHeaders: () => { Authorization: string } | {};
  backendUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api';

  useEffect(() => {
    const savedToken = localStorage.getItem('cam_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setLoading(false);
      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
  }, [pathname, loading, user]);

  const fetchUser = async (authToken: string) => {
    try {
      let response;
      try {
        response = await fetch(`${backendUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        // Fallback to localhost if 127.0.0.1 failed
        response = await fetch(`http://localhost:8001/api/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Backend server unreachable:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    let response: Response | null = null;
    let lastError: any = null;

    const urlsToTry = [
      `${backendUrl}/auth/login/json`,
      `http://localhost:8001/api/auth/login/json`,
      `http://127.0.0.1:8001/api/auth/login/json`,
      `http://localhost:8001/auth/login/json`,
    ];

    for (const url of urlsToTry) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (response) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!response) {
      setLoading(false);
      throw new Error(
        'Cannot connect to backend server at http://127.0.0.1:8001. Please ensure uvicorn is running in terminal!'
      );
    }

    if (!response.ok) {
      setLoading(false);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed. Please check your email and password.');
    }

    const data = await response.json();
    localStorage.setItem('cam_token', data.access_token);
    setToken(data.access_token);
    await fetchUser(data.access_token);
    router.push('/dashboard');
  };

  const register = async (email: string, full_name: string, role: string, password: string) => {
    setLoading(true);
    let response: Response | null = null;

    const urlsToTry = [
      `${backendUrl}/auth/register`,
      `http://localhost:8001/api/auth/register`,
      `http://127.0.0.1:8001/api/auth/register`,
      `http://localhost:8001/auth/register`,
    ];

    for (const url of urlsToTry) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, full_name, role, password }),
        });
        if (response) break;
      } catch (err) {
        // try next fallback
      }
    }

    if (!response) {
      setLoading(false);
      throw new Error(
        'Cannot connect to backend server at http://127.0.0.1:8001. Please ensure uvicorn is running in terminal!'
      );
    }

    if (!response.ok) {
      setLoading(false);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed. User may already exist.');
    }

    setLoading(false);
  };


  const logout = () => {
    localStorage.removeItem('cam_token');
    setToken(null);
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        register,
        getAuthHeaders,
        backendUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
