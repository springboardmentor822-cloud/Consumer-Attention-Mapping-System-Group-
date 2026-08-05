import API from "./api";

// Get all shelves
export const getShelves = async () => {
  const response = await API.get("/shelves/");
  return response.data;
};

// Get shelf by ID
export const getShelf = async (id) => {
  const response = await API.get(`/shelves/${id}`);
  return response.data;
};

// Create shelf
export const createShelf = async (data) => {
  const response = await API.post("/shelves/", data);
  return response.data;
};

// Update shelf
export const updateShelf = async (id, data) => {
  const response = await API.put(`/shelves/${id}`, data);
  return response.data;
};

// Delete shelf
export const deleteShelf = async (id) => {
  const response = await API.delete(`/shelves/${id}`);
  return response.data;
};