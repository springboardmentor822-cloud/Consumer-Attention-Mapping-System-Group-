import api from "./client";

export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  profile: () => api.get("/auth/profile"),
  users: () => api.get("/auth/users"),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};

export const makeResourceApi = (path) => ({
  list: () => api.get(path),
  create: (payload) => api.post(path, payload),
  update: (id, payload) => api.put(`${path}/${id}`, payload),
  remove: (id) => api.delete(`${path}/${id}`),
});

export const storesApi = makeResourceApi("/stores");
export const shelvesApi = makeResourceApi("/shelves");
export const productsApi = makeResourceApi("/products");
export const camerasApi = makeResourceApi("/cameras");
export const zonesApi = makeResourceApi("/zones");
