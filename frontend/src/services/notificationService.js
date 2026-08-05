import API from "./api";

export const getNotifications = async () => {
  const response = await API.get("/notifications");
  return response.data;
};

export const getNotification = async (id) => {
  const response = await API.get(`/notifications/${id}`);
  return response.data;
};