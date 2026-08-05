import API from "./api";

// Get all cameras
export const getCameras = async () => {
  const response = await API.get("/cameras/");
  return response.data;
};

// Get camera by ID
export const getCamera = async (id) => {
  const response = await API.get(`/cameras/${id}`);
  return response.data;
};

// Create camera
export const createCamera = async (camera) => {
  const response = await API.post("/cameras/", camera);
  return response.data;
};

// Update camera
export const updateCamera = async (id, camera) => {
  const response = await API.put(`/cameras/${id}`, camera);
  return response.data;
};

// Delete camera
export const deleteCamera = async (id) => {
  const response = await API.delete(`/cameras/${id}`);
  return response.data;
};