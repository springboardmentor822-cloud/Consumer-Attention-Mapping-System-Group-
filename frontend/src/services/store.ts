import { api } from './api';
import type { Store, StorePayload } from '../types/store';

export async function listStores(): Promise<Store[]> {
  const response = await api.get<Store[]>('/stores');
  return response.data;
}

export async function getStore(storeId: string): Promise<Store> {
  const response = await api.get<Store>(`/stores/${storeId}`);
  return response.data;
}

export async function createStore(payload: StorePayload): Promise<Store> {
  const response = await api.post<Store>('/stores', payload);
  return response.data;
}

export async function updateStore(storeId: string, payload: Partial<StorePayload>): Promise<Store> {
  const response = await api.put<Store>(`/stores/${storeId}`, payload);
  return response.data;
}

export async function deleteStore(storeId: string): Promise<void> {
  await api.delete(`/stores/${storeId}`);
}
