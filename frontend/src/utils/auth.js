// CAMS Authentication Utilities
// Manages localStorage-based session for RBAC

const SESSION_KEY = "cams_session";

// Mapping backend DB roles to UI labels
export const ROLE_LABELS = {
  "admin": "Administrator",
  "store_manager": "Store Manager",
  "retail_analyst": "Retail Analyst",
  "marketing_manager": "Marketing Manager",
};

// Map DB roles to home routes
const ROUTE_MAP = {
  "admin": "/admin",
  "store_manager": "/store-manager",
  "retail_analyst": "/retail-analyst",
  "marketing_manager": "/marketing-manager",
};

export const PORTAL_ROUTE_PREFIXES = {
  admin: "/admin",
  store_manager: "/store-manager",
  retail_analyst: "/retail-analyst",
  marketing_manager: "/marketing-manager",
};

/**
 * Authenticate with the backend API
 * @param {string} email
 * @param {string} password 
 */
export async function login(email, password) {
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }
    
    const { user, token } = result.data;
    
    const session = {
      role: ROLE_LABELS[user.role] || "User",
      roleKey: user.role, // "admin", "store_manager", etc
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      token,
      loginTime: new Date().toISOString(),
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
}

/**
 * Register a new user with the backend API
 * @param {string} fullName
 * @param {string} email
 * @param {string} password 
 * @param {string} roleKey 
 */
export async function registerUser(fullName, email, password, roleKey) {
  try {
    const response = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        full_name: fullName, 
        email: email, 
        username: email, // Using email as username for registration
        password: password,
        role: roleKey
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }
    
    // Automatically log in the user using the returned token
    const { user, token } = result.data;
    
    const session = {
      role: ROLE_LABELS[user.role] || "User",
      roleKey: user.role, 
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      token,
      loginTime: new Date().toISOString(),
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}

/**
 * Clear the current session
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Get current session object, or null if not logged in
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
 * @param {string} requiredRoleKey - e.g. "admin", "store_manager", "retail_analyst", "marketing_manager"
 */
export function hasRole(requiredRoleKey) {
  const session = getSession();
  if (!session) return false;
  return session.roleKey === requiredRoleKey;
}

/**
 * Get the home route for a given role key
 * @param {string} roleKey - Database role key
 */
export function getHomeRoute(roleKey) {
  return ROUTE_MAP[roleKey] || "/login";
}

/**
 * Update the profile data in the backend
 */
export async function updateProfileAPI(profileData) {
  try {
    const session = getSession();
    if (!session || !session.token) {
      throw new Error("No active session");
    }

    const response = await fetch('http://localhost:5001/api/auth/profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(profileData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Profile update failed');
    }
    
    return result.data.user;
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
}

/**
 * Update local session profile fields (called after a successful backend update)
 */
export function updateSessionProfile(updatedFields) {
  const session = getSession();
  if (session) {
    const updatedSession = { ...session, ...updatedFields };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  }
  return null;
}
