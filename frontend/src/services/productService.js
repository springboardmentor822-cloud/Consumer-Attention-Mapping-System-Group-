import API from "./api";

// ========================================
// GET ALL PRODUCTS
// ========================================

export const getProducts = async () => {
  const response = await API.get("/products");
  return response.data;
};

// ========================================
// GET PRODUCT BY ID
// ========================================

export const getProduct = async (id) => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};

// ========================================
// CREATE PRODUCT
// ========================================

export const createProduct = async (product) => {
  const response = await API.post("/products", product);
  return response.data;
};

// ========================================
// UPDATE PRODUCT
// ========================================

export const updateProduct = async (id, product) => {
  const response = await API.put(`/products/${id}`, product);
  return response.data;
};

// ========================================
// DELETE PRODUCT
// ========================================

export const deleteProduct = async (id) => {
  const response = await API.delete(`/products/${id}`);
  return response.data;
};