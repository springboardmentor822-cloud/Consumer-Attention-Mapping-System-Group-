import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { apiClient } from '../lib/axios';

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('attention_token');
    const savedUserStr = localStorage.getItem('attention_user');
    if (savedToken && savedUserStr) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUserStr));
      } catch (err) {
        localStorage.removeItem('attention_token');
        localStorage.removeItem('attention_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post<AuthResponse>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;
    localStorage.setItem('attention_token', data.access_token);
    
    const userPayload: User = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      email: data.email,
      role: data.role,
      is_active: true
    };
    
    localStorage.setItem('attention_user', JSON.stringify(userPayload));
    setToken(data.access_token);
    setUser(userPayload);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('attention_token');
    localStorage.removeItem('attention_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
