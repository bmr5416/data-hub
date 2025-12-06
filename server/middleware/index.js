/**
 * Middleware Barrel Exports
 *
 * Central export point for all Express middleware.
 */

// Authentication
export { requireAuth, requireAdmin, optionalAuth } from './auth.js';

// Client access control
export { requireClientAccess, checkClientAccess } from './clientAccess.js';
export { attachUserClients } from './userClients.js';

// Error handling
export { errorHandler, AppError } from './errorHandler.js';

// Request utilities
export { requestIdMiddleware } from './requestId.js';
export { timeoutMiddleware } from './timeout.js';
export { rateLimiter, apiLimiter, strictLimiter } from './rateLimiter.js';
export { sanitizeInput, sanitizeOutput } from './sanitize.js';

// Validation
export { validateUUIDParam, validateEntityIdParam, validateParams } from './validateParams.js';
export { validateRequest, schemas } from './validateRequest.js';
