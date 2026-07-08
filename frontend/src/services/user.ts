import { api } from './api';

export interface UserManagementItem {
  id: string;
  email: string;
  role: {
    id: number;
    role_name: string;
  };
  is_active: boolean;
  created_at: string;
}

export async function listAllUsers(): Promise<UserManagementItem[]> {
  const response = await api.get<UserManagementItem[]>('/users');
  return response.data;
}

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<UserManagementItem> {
  const response = await api.put<UserManagementItem>(`/users/${userId}/status`, null, {
    params: { is_active: isActive },
  });
  return response.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`);
}
