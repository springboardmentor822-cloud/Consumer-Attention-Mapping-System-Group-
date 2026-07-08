export interface Camera {
  id: string;
  store_id: string;
  camera_name: string;
  camera_source: string;
  status: string;
}

export interface CameraPayload {
  store_id: string;
  camera_name: string;
  camera_source: string;
  status: string;
}
