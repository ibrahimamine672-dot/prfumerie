/**
 * Shared auth token utilities.
 *
 * Provides a single source of truth for reading the auth token,
 * avoiding direct localStorage access scattered across components.
 */

export const AUTH_TOKEN_KEY = 'token';

/**
 * Get the auth token from localStorage.
 * Components that have access to AuthContext should destructure `token` from `useAuth()` instead.
 * This is a safe fallback for code paths (e.g. async handlers) that run outside the render cycle.
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}
