export type RoleName = 'Administrator' | 'Store Manager' | 'Retail Analyst' | 'Marketing Manager';

export interface AuthUser {
  id: string;
  email: string;
  role: RoleName;
  is_active: boolean;
  store_id?: string | null;
}

export interface BackendRole {
  id: number;
  role_name: RoleName;
}

export interface BackendUser {
  id: string;
  email: string;
  role: BackendRole;
  is_active: boolean;
  store_id?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  role?: RoleName;
}
