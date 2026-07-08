import { api } from './api';
import type { Shelf, ShelfPayload } from '../types/shelf';

export async function listShelves(storeId: string): Promise<Shelf[]> {
  const response = await api.get<Shelf[]>(`/stores/${storeId}/shelves`);
  return response.data;
}

export async function createShelf(storeId: string, payload: ShelfPayload): Promise<Shelf> {
  const response = await api.post<Shelf>(`/stores/${storeId}/shelves`, payload);
  return response.data;
}

export async function updateShelf(shelfId: string, payload: Partial<ShelfPayload>): Promise<Shelf> {
  const response = await api.put<Shelf>(`/shelves/${shelfId}`, payload);
  return response.data;
}

export async function deleteShelf(shelfId: string): Promise<void> {
  await api.delete(`/shelves/${shelfId}`);
}
