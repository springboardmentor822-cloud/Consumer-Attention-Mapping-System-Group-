import API from "./api";

// ===============================
// LOGIN
// ===============================

export const loginUser = async (data) => {

  const response = await API.post(
    "/auth/login",
    data
  );

  return response.data;

};

// ===============================
// REGISTER
// ===============================

export const registerUser = async (data) => {

  const response = await API.post(
    "/auth/register",
    data
  );

  return response.data;

};

// ===============================
// GET ALL USERS
// ===============================

export const getUsers = async () => {

  const response = await API.get(
    "/users"
  );

  return response.data;

};

// ===============================
// GET USER
// ===============================

export const getUser = async (id) => {

  const response = await API.get(
    `/users/${id}`
  );

  return response.data;

};

// ===============================
// CREATE USER
// ===============================

export const createUser = async (data) => {

  const response = await API.post(
    "/users",
    data
  );

  return response.data;

};

// ===============================
// UPDATE USER
// ===============================

export const updateUser = async (
  id,
  data
) => {

  const response = await API.put(
    `/users/${id}`,
    data
  );

  return response.data;

};

// ===============================
// DELETE USER
// ===============================

export const deleteUser = async (
  id
) => {

  const response = await API.delete(
    `/users/${id}`
  );

  return response.data;

};