/**
 * Route Constants
 *
 * Centralized route path definitions for the Data Hub application.
 * Use these constants throughout the app to ensure consistency
 * and simplify route changes.
 */

// =============================================================================
// PUBLIC ROUTES (no authentication required)
// =============================================================================

export const ROUTES = {
  // Public pages
  LANDING: '/',
  LOGIN: '/login',

  // Protected app routes (require authentication)
  DASHBOARD: '/dashboard',
  SETTINGS: '/dashboard/settings',

  // Dynamic routes (use helper functions below)
  CLIENT_DETAIL: '/dashboard/clients/:clientId',
  NEW_CLIENT: '/dashboard/clients/new',
};

// =============================================================================
// ROUTE HELPERS (for dynamic routes)
// =============================================================================

/**
 * Generate client detail route
 * @param {string} clientId - The client's UUID
 * @returns {string} Full route path
 */
export function clientDetailRoute(clientId) {
  return `/dashboard/clients/${clientId}`;
}

/**
 * Generate route with state for opening modals
 * @param {string} route - Base route
 * @param {object} state - Navigation state
 * @returns {object} Route config for Link/navigate
 */
export function routeWithState(route, state) {
  return { pathname: route, state };
}

// =============================================================================
// ROUTE GROUPS (for guards and navigation)
// =============================================================================

/**
 * Routes that don't require authentication
 */
export const PUBLIC_ROUTES = [ROUTES.LANDING, ROUTES.LOGIN];

/**
 * Check if a path is a public route
 * @param {string} pathname - Current pathname
 * @returns {boolean}
 */
export function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname);
}

/**
 * Check if a path is a protected route
 * @param {string} pathname - Current pathname
 * @returns {boolean}
 */
export function isProtectedRoute(pathname) {
  return pathname.startsWith('/dashboard');
}

export default ROUTES;
