import API from "./api";

// ========================================
// GET ALL STORES
// ========================================

export const getStores = async () => {
  const response = await API.get("/stores");
  return response.data;
};

// ========================================
// GET STORE BY ID
// ========================================

export const getStore = async (id) => {
  const response = await API.get(`/stores/${id}`);
  return response.data;
};

// ========================================
// CREATE STORE
// ========================================

export const createStore = async (store) => {
  const response = await API.post("/stores", store);
  return response.data;
};

// ========================================
// UPDATE STORE
// ========================================

export const updateStore = async (id, store) => {
  const response = await API.put(`/stores/${id}`, store);
  return response.data;
};

// ========================================
// DELETE STORE
// ========================================

export const deleteStore = async (id) => {
  const response = await API.delete(`/stores/${id}`);
  return response.data;
};