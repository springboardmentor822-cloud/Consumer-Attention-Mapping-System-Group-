import { api } from './api';
import type { 
  ShopperSession, 
  ShopperSessionPayload,
  AttentionEvent,
  AttentionEventPayload,
  InteractionEvent,
  InteractionEventPayload
} from '../types/tracking';

export async function createShopperSession(storeId: string, payload: ShopperSessionPayload): Promise<ShopperSession> {
  const response = await api.post<ShopperSession>('/tracking/sessions', payload, { params: { store_id: storeId } });
  return response.data;
}

export async function updateShopperSession(sessionId: string, payload: Partial<ShopperSessionPayload>): Promise<ShopperSession> {
  const response = await api.put<ShopperSession>(`/tracking/sessions/${sessionId}`, payload);
  return response.data;
}

export async function logAttentionEvent(sessionId: string, payload: AttentionEventPayload): Promise<AttentionEvent> {
  const response = await api.post<AttentionEvent>(`/tracking/sessions/${sessionId}/attention`, payload);
  return response.data;
}

export async function logInteractionEvent(sessionId: string, payload: InteractionEventPayload): Promise<InteractionEvent> {
  const response = await api.post<InteractionEvent>(`/tracking/sessions/${sessionId}/interaction`, payload);
  return response.data;
}
