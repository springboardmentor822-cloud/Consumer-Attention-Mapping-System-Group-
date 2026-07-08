import { api } from './api';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from '../types/auth';

function mapUser(user: AuthResponse['user']): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role.role_name,
    is_active: user.is_active,
    store_id: user.store_id,
  };
}

export async function login(payload: LoginPayload): Promise<{ token: string; user: AuthUser }> {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  return {
    token: response.data.access_token,
    user: mapUser(response.data.user),
  };
}

export async function register(payload: RegisterPayload): Promise<{ token: string; user: AuthUser }> {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return {
    token: response.data.access_token,
    user: mapUser(response.data.user),
  };
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthResponse['user']>('/users/me');
  return mapUser(response.data);
}
