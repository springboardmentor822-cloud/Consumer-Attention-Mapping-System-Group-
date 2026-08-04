export type UserRole = 'Administrator' | 'Store Manager' | 'Retail Analyst' | 'Marketing Manager';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  email: string;
  role: UserRole;
}
