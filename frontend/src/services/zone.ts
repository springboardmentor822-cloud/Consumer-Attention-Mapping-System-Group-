import { api } from './api';
import type { Zone, ZonePayload } from '../types/zone';

export async function listZones(storeId?: string): Promise<Zone[]> {
  const params = storeId ? { store_id: storeId } : undefined;
  const response = await api.get<Zone[]>('/zones', { params });
  return response.data;
}

export async function getZone(zoneId: string): Promise<Zone> {
  const response = await api.get<Zone>(`/zones/${zoneId}`);
  return response.data;
}

export async function createZone(storeId: string, payload: ZonePayload): Promise<Zone> {
  const response = await api.post<Zone>('/zones', payload, { params: { store_id: storeId } });
  return response.data;
}

export async function updateZone(zoneId: string, payload: Partial<ZonePayload>): Promise<Zone> {
  const response = await api.put<Zone>(`/zones/${zoneId}`, payload);
  return response.data;
}

export async function deleteZone(zoneId: string): Promise<void> {
  await api.delete(`/zones/${zoneId}`);
}
