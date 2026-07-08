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

export async function updateUser(
  userId: string,
  payload: { role_id?: number; store_id?: string | null; is_active?: boolean }
): Promise<UserManagementItem> {
  const response = await api.put<UserManagementItem>(`/users/${userId}`, payload);
  return response.data;
}

export async function listRoles(): Promise<{ id: number; role_name: string }[]> {
  const response = await api.get<{ id: number; role_name: string }[]>('/users/roles');
  return response.data;
}
