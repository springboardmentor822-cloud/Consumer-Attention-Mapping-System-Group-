import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'camst_token';
const USER_KEY = 'camst_user';
const THEME_KEY = 'camst_theme';

export const authStorage = {
  getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): AuthUser | null {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  setUser(user: AuthUser): void {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

export const themeStorage = {
  get(): 'light' | 'dark' {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  },
  set(theme: 'light' | 'dark'): void {
    window.localStorage.setItem(THEME_KEY, theme);
  },
};
