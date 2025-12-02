/**
 * User Clients Middleware
 *
 * Fetches user's assigned client IDs for filtering list endpoints.
 * Must be used after requireAuth middleware.
 */

import { supabase } from '../services/supabaseClient.js';
import logger from '../utils/logger.js';

/**
 * Attach user's assigned client IDs to request
 *
 * For admins, sets req.userClientIds = null (meaning all clients)
 * For regular users, sets req.userClientIds = ['c-abc123', ...]
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export async function attachUserClientIds(req, res, next) {
  try {
    if (!req.user?.id) {
      req.userClientIds = [];
      return next();
    }

    // Admins can access all clients
    if (req.user.isAdmin) {
      req.userClientIds = null;
      return next();
    }

    // Get user's client assignments
    const { data, error } = await supabase
      .from('user_client_assignments')
      .select('client_id')
      .eq('user_id', req.user.id);

    if (error) {
      logger.error('Failed to fetch user client assignments', {
        userId: req.user.id,
        error: error.message,
        requestId: req.id,
        component: 'UserClients',
      });
      throw error;
    }

    req.userClientIds = data.map((row) => row.client_id);

    logger.debug('User client IDs attached', {
      userId: req.user.id,
      clientCount: req.userClientIds.length,
      requestId: req.id,
      component: 'UserClients',
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Filter an array of entities by user's client access
 *
 * @param {Array} entities - Array of entities with clientId or id property
 * @param {string[]|null} userClientIds - User's assigned client IDs (null = all)
 * @returns {Array} Filtered entities
 */
export function filterByClientAccess(entities, userClientIds) {
  // null means admin - no filtering
  if (userClientIds === null) {
    return entities;
  }

  // Empty array means no access to any clients
  if (userClientIds.length === 0) {
    return [];
  }

  // Filter to only user's assigned clients
  const clientIdSet = new Set(userClientIds);
  return entities.filter((entity) => {
    // Handle both clientId (for child entities) and id (for clients themselves)
    const id = entity.clientId || entity.id;
    return clientIdSet.has(id);
  });
}
