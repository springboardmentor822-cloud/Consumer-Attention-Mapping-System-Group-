export const ROLES = {
  STORE_MANAGER: "store_manager",
  RETAIL_ANALYST: "retail_analyst",
  MARKETING_MANAGER: "marketing_manager",
  ADMINISTRATOR: "administrator",
};

export const ROLE_LABELS = {
  [ROLES.STORE_MANAGER]: "Store Manager",
  [ROLES.RETAIL_ANALYST]: "Retail Analyst",
  [ROLES.MARKETING_MANAGER]: "Marketing Manager",
  [ROLES.ADMINISTRATOR]: "Administrator",
};

export function canSeeAllRecords(role) {
  return role === ROLES.STORE_MANAGER || role === ROLES.ADMINISTRATOR;
}

export function canManageStores(role) {
  return role === ROLES.STORE_MANAGER || role === ROLES.ADMINISTRATOR;
}

export function canManageCameras(role) {
  return role === ROLES.STORE_MANAGER || role === ROLES.ADMINISTRATOR;
}

export function canManageUsers(role) {
  return role === ROLES.ADMINISTRATOR;
}

export function canViewAnalyse(role) {
  return role === ROLES.ADMINISTRATOR || role === ROLES.RETAIL_ANALYST;
}

export function isAdmin(role) {
  return role === ROLES.ADMINISTRATOR;
}

export function isStoreManager(role) {
  return role === ROLES.STORE_MANAGER;
}

export function isViewOnlyRole(role) {
  return role === ROLES.RETAIL_ANALYST || role === ROLES.MARKETING_MANAGER;
}

// Page access permissions per role
const ANALYTICS_ROUTES = ["/analyse", "/attention", "/dwell", "/heatmaps", "/journey", "/product-analytics", "/shelf-analytics"];
const REPORT_ROUTES = ["/reports", "/weekly-reports", "/monthly-reports", "/export"];
const USER_ROUTES = ["/users", "/managers", "/analysts", "/security"];
const SYSTEM_ROUTES = ["/settings", "/logs", "/notifications", "/profile"];

const MARKETING_ROUTES = ["/marketing", "/marketing-dashboard"];
const ANALYST_ROUTES = ["/analyst", "/analyst-dashboard"];
const STORE_MANAGER_ROUTES = ["/store-manager", "/store-manager-dashboard"];

export const ROLE_PAGE_ACCESS = {
  [ROLES.ADMINISTRATOR]: [
    "/dashboard", "/store", "/shelves", "/products", "/zones", "/cameras", "/video-upload",
    ...ANALYTICS_ROUTES, ...REPORT_ROUTES, ...USER_ROUTES, ...SYSTEM_ROUTES, ...MARKETING_ROUTES, ...ANALYST_ROUTES, ...STORE_MANAGER_ROUTES, "/admin"
  ],
  [ROLES.RETAIL_ANALYST]: [
    "/dashboard", "/shelves", "/products", "/zones",
    ...ANALYTICS_ROUTES, ...REPORT_ROUTES, ...ANALYST_ROUTES, ...SYSTEM_ROUTES
  ],
  [ROLES.STORE_MANAGER]: [
    "/dashboard", "/store", "/shelves", "/products", "/zones", "/cameras", "/video-upload",
    ...REPORT_ROUTES, ...STORE_MANAGER_ROUTES, ...SYSTEM_ROUTES
  ],
  [ROLES.MARKETING_MANAGER]: [
    "/dashboard", "/products", "/zones",
    ...REPORT_ROUTES, ...MARKETING_ROUTES, ...SYSTEM_ROUTES
  ],
};

