import API from "./api";

// ======================================
// GET ALL CONSUMERS
// ======================================

export const getConsumers = async () => {

  const response = await API.get("/consumers");

  return response.data;

};

// ======================================
// GET SINGLE CONSUMER
// ======================================

export const getConsumer = async (id) => {

  const response = await API.get(`/consumers/${id}`);

  return response.data;

};

// ======================================
// CREATE CONSUMER
// ======================================

export const createConsumer = async (consumerData) => {

  const response = await API.post(
    "/consumers",
    consumerData
  );

  return response.data;

};

// ======================================
// UPDATE CONSUMER
// ======================================

export const updateConsumer = async (
  id,
  consumerData
) => {

  const response = await API.put(
    `/consumers/${id}`,
    consumerData
  );

  return response.data;

};

// ======================================
// DELETE CONSUMER
// ======================================

export const deleteConsumer = async (id) => {

  const response = await API.delete(
    `/consumers/${id}`
  );

  return response.data;

};