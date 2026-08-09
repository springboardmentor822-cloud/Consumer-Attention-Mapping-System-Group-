export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  store_id: number | null;
  created_at: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login(payload: { email: string; password: string }): Promise<void>;
  register(payload: Record<string, unknown>): Promise<void>;
  logout(): void;
}

export function useAuth(): AuthContextValue;
