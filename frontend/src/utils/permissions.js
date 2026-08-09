export const roles = ["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"];
export const storeStatuses = ["Active", "Inactive"];
export const cameraStatuses = ["Online", "Offline", "Maintenance"];

export function canWrite(user) {
  return ["Admin", "Store Manager"].includes(user?.role);
}

export function canViewUsers(user) {
  return user?.role === "Admin";
}
