export interface ShopperSession {
  id: string;
  store_id: string;
  start_time: string;
  end_time: string | null;
  path_data: Record<string, unknown>;
  created_at: string;
}

export interface ShopperSessionPayload {
  start_time: string;
  end_time?: string | null;
  path_data?: Record<string, unknown>;
}

export interface AttentionEvent {
  id: string;
  session_id: string;
  camera_id: string | null;
  timestamp: string;
  target_type: string;
  target_id: string | null;
  gaze_duration_seconds: number;
  created_at: string;
}

export interface AttentionEventPayload {
  camera_id?: string | null;
  timestamp: string;
  target_type: string;
  target_id?: string | null;
  gaze_duration_seconds: number;
}

export interface InteractionEvent {
  id: string;
  session_id: string;
  product_id: string;
  interaction_type: string;
  timestamp: string;
  created_at: string;
}

export interface InteractionEventPayload {
  product_id: string;
  interaction_type: string;
  timestamp: string;
}
