// CAMS Authentication Utilities
// Manages localStorage-based session for RBAC

const SESSION_KEY = "cams_session";

const ROLE_MAP = {
  "Administrator": "admin",
  "Store Manager": "store",
  "Retail Analyst": "analyst",
  "Marketing Manager": "marketing",
};

const ROUTE_MAP = {
  "Administrator": "/admin",
  "Store Manager": "/store-manager",
  "Retail Analyst": "/retail-analyst",
  "Marketing Manager": "/marketing-manager",
};

export const PORTAL_ROUTE_PREFIXES = {
  admin: "/admin",
  store: "/store-manager",
  analyst: "/retail-analyst",
  marketing: "/marketing-manager",
};

/**
 * Save login session to localStorage
 * @param {string} role - Full role name e.g. "Administrator"
 * @param {string} email - User email
 */
export function login(role, email) {
  const session = {
    role,          // Full display name: "Administrator", "Store Manager", etc.
    roleKey: ROLE_MAP[role] || "store",
    email,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Clear the current session
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Get current session object, or null if not logged in
 * @returns {{ role: string, roleKey: string, email: string, loginTime: string } | null}
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check if a user is authenticated
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Check if the current session matches the required portal role key
 * @param {string} requiredRoleKey - e.g. "admin", "store", "analyst", "marketing"
 */
export function hasRole(requiredRoleKey) {
  const session = getSession();
  if (!session) return false;
  return session.roleKey === requiredRoleKey;
}

/**
 * Get the home route for a given full role name
 * @param {string} role - Full role name
 */
export function getHomeRoute(role) {
  return ROUTE_MAP[role] || "/login";
}
