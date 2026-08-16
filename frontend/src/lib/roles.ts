import type { Role } from "../types";

/**
 * Where each role lands right after login / when hitting an unknown route.
 * Keeping this in one place means the redirect logic, the sidebar nav, and
 * the route guards can never disagree with each other.
 */
export const ROLE_HOME: Record<Role, string> = {
  administrator: "/admin",
  store_manager: "/dashboard",
  retail_analyst: "/analyst",
  marketing_manager: "/marketing",
};

export const ROLE_LABEL: Record<Role, string> = {
  administrator: "Administrator",
  store_manager: "Store Manager",
  retail_analyst: "Retail Analyst",
  marketing_manager: "Marketing Manager",
};

export function homePathForRole(role: Role): string {
  return ROLE_HOME[role] ?? "/";
}
