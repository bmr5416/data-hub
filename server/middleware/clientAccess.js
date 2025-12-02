/**
 * Client Access Middleware
 *
 * Verifies that authenticated users have access to specific clients.
 * Uses user_client_assignments table to check permissions.
 *
 * Must be used after requireAuth middleware.
 */

import { supabase } from '../services/supabaseClient.js';
import { AppError } from '../errors/AppError.js';
import logger from '../utils/logger.js';

// Valid client roles in order of increasing privilege
const CLIENT_ROLES = ['viewer', 'editor', 'admin'];

/**
 * Verify user has access to the requested client
 *
 * Checks for client ID in:
 * 1. req.params.clientId
 * 2. req.params.id (for routes like /clients/:id)
 * 3. req.body.clientId
 *
 * Admin users bypass all checks.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export async function requireClientAccess(req, res, next) {
  try {
    // Extract client ID from various sources
    const clientId = req.params.clientId || req.params.id || req.body?.clientId;

    // If no client context needed, continue
    if (!clientId) {
      return next();
    }

    // Require authentication
    if (!req.user?.id) {
      throw AppError.unauthorized('Authentication required');
    }

    // Admins have access to all clients
    if (req.user.isAdmin) {
      req.clientRole = 'admin';
      return next();
    }

    // Check if user has assignment to this client
    const { data: assignment, error } = await supabase
      .from('user_client_assignments')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('client_id', clientId)
      .single();

    if (error || !assignment) {
      logger.warn('Client access denied', {
        userId: req.user.id,
        clientId,
        requestId: req.id,
        component: 'ClientAccess',
      });
      throw AppError.forbidden('Access denied to this client');
    }

    // Attach client role to request for downstream use
    req.clientRole = assignment.role;

    logger.debug('Client access granted', {
      userId: req.user.id,
      clientId,
      role: assignment.role,
      requestId: req.id,
      component: 'ClientAccess',
    });

    next();
  } catch (error) {
    // Pass through AppErrors, wrap others
    if (error instanceof AppError) {
      return next(error);
    }
    return next(AppError.internal('Failed to verify client access'));
  }
}

/**
 * Require specific client role(s) for an operation
 *
 * Must be used after requireClientAccess middleware.
 * Admins always have access.
 *
 * @param {...string} allowedRoles - Roles that can access (e.g., 'editor', 'admin')
 * @returns {import('express').RequestHandler} Express middleware
 *
 * @example
 * // Allow only editors and admins to modify
 * router.put('/:id', requireClientAccess, requireClientRole('editor', 'admin'), handler);
 *
 * @example
 * // Allow only admins to delete
 * router.delete('/:id', requireClientAccess, requireClientRole('admin'), handler);
 */
export function requireClientRole(...allowedRoles) {
  return (req, res, next) => {
    // Admins always have access
    if (req.user?.isAdmin) {
      return next();
    }

    // Check if client role was set by requireClientAccess
    if (!req.clientRole) {
      return next(AppError.forbidden('Client access not verified'));
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.clientRole)) {
      logger.warn('Insufficient client role', {
        userId: req.user?.id,
        clientRole: req.clientRole,
        requiredRoles: allowedRoles,
        requestId: req.id,
        component: 'ClientAccess',
      });
      return next(AppError.forbidden(`Requires one of: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}

/**
 * Check if a role has at least the specified minimum privilege
 *
 * @param {string} userRole - User's current role
 * @param {string} minRole - Minimum required role
 * @returns {boolean} True if user has sufficient privilege
 */
export function hasMinimumRole(userRole, minRole) {
  const userLevel = CLIENT_ROLES.indexOf(userRole);
  const minLevel = CLIENT_ROLES.indexOf(minRole);

  if (userLevel === -1 || minLevel === -1) {
    return false;
  }

  return userLevel >= minLevel;
}

/**
 * Middleware to require minimum role level
 *
 * Allows roles at or above the specified level.
 * E.g., requireMinimumRole('editor') allows 'editor' and 'admin'.
 *
 * @param {string} minRole - Minimum required role
 * @returns {import('express').RequestHandler} Express middleware
 */
export function requireMinimumRole(minRole) {
  return (req, res, next) => {
    // Admins always have access
    if (req.user?.isAdmin) {
      return next();
    }

    if (!req.clientRole) {
      return next(AppError.forbidden('Client access not verified'));
    }

    if (!hasMinimumRole(req.clientRole, minRole)) {
      logger.warn('Insufficient privilege level', {
        userId: req.user?.id,
        clientRole: req.clientRole,
        minimumRequired: minRole,
        requestId: req.id,
        component: 'ClientAccess',
      });
      return next(AppError.forbidden(`Requires ${minRole} or higher`));
    }

    next();
  };
}
