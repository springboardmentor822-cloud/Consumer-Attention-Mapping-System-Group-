import * as React from 'react';

import { fetchCurrentUser, login as loginRequest, register as registerRequest } from '../services/auth';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth';
import { authStorage } from '../utils/storage';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  setSession: (token: string, user: AuthUser) => void;
  refreshUser?: () => Promise<AuthUser | undefined>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = React.useState<AuthUser | null>(authStorage.getUser());
  const [token, setToken] = React.useState<string | null>(authStorage.getToken());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const initialize = async (): Promise<void> => {
      const storedToken = authStorage.getToken();
      const storedUser = authStorage.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setLoading(false);
        try {
          const freshUser = await fetchCurrentUser();
          authStorage.setUser(freshUser);
          setUser(freshUser);
        } catch {
          authStorage.clear();
          setToken(null);
          setUser(null);
        }
        return;
      }

      setLoading(false);
    };

    void initialize();
  }, []);

  const setSession = React.useCallback((nextToken: string, nextUser: AuthUser) => {
    authStorage.setToken(nextToken);
    authStorage.setUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = React.useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    setSession(response.token, response.user);
    return response.user;
  }, [setSession]);

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    return response.user;
  }, []);

  const refreshUser = React.useCallback(async () => {
    try {
      const freshUser = await fetchCurrentUser();
      authStorage.setUser(freshUser);
      setUser(freshUser);
      return freshUser;
    } catch {
      // ignore
    }
  }, []);

  const logout = React.useCallback(() => {
    authStorage.clear();
    setToken(null);
    setUser(null);
    window.location.assign('/login');
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      register,
      logout,
      setSession,
      refreshUser,
    }),
    [loading, login, logout, register, setSession, token, user, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
