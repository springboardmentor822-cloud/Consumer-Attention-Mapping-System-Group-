import { api } from './api';
import type { Camera, CameraPayload } from '../types/camera';

export async function listCameras(): Promise<Camera[]> {
  const response = await api.get<Camera[]>('/cameras');
  return response.data;
}

export async function createCamera(payload: CameraPayload): Promise<Camera> {
  const response = await api.post<Camera>('/cameras', payload);
  return response.data;
}

export async function updateCamera(cameraId: string, payload: Partial<CameraPayload>): Promise<Camera> {
  const response = await api.put<Camera>(`/cameras/${cameraId}`, payload);
  return response.data;
}

export async function deleteCamera(cameraId: string): Promise<void> {
  await api.delete(`/cameras/${cameraId}`);
}
