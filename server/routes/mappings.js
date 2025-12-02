/**
 * Platform Mappings API Routes
 *
 * Handles CRUD operations for custom client platform field mappings.
 */

import { Router } from 'express';
import {
  getClientPlatformMappings,
  getAllClientMappings,
  getCustomMapping,
  createCustomMapping,
  updateCustomMapping,
  deleteCustomMapping,
  resetPlatformMappings,
} from '../services/mappingService.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateUUID, validateEntityId } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';

const router = Router();

// All mapping routes require authentication
router.use(requireAuth);

/**
 * Middleware to look up mapping and attach client_id for authorization
 */
async function attachMappingClientId(req, res, next) {
  try {
    const mappingId = req.params.mappingId;
    if (!mappingId) return next();

    validateUUID(mappingId, 'mappingId');
    const mapping = await getCustomMapping(mappingId);
    if (!mapping) {
      throw new AppError('Mapping not found', 404);
    }

    // Attach client_id for requireClientAccess to use
    req.params.clientId = mapping.clientId;
    req.mapping = mapping;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clients/:clientId/mappings
 * List all custom mappings for a client
 */
router.get('/clients/:clientId/mappings', requireClientAccess, async (req, res, next) => {
  try {
    validateEntityId(req.params.clientId, 'clientId');
    const mappings = await getAllClientMappings(req.params.clientId);
    res.json({ mappings });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/mappings/:platformId
 * Get mappings for a specific client platform (merged with defaults)
 */
router.get('/clients/:clientId/mappings/:platformId', requireClientAccess, async (req, res, next) => {
  try {
    const { clientId, platformId } = req.params;
    validateEntityId(clientId, 'clientId');
    const mappings = await getClientPlatformMappings(clientId, platformId);
    res.json({ mappings });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:clientId/mappings
 * Create a custom mapping for a client (requires editor role)
 */
router.post('/clients/:clientId/mappings', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    validateEntityId(clientId, 'clientId');
    const { platformId, fieldType, canonicalId, platformFieldName, transformation } = req.body;

    if (!platformId || !fieldType || !canonicalId || !platformFieldName) {
      throw new AppError(
        'platformId, fieldType, canonicalId, and platformFieldName are required',
        400
      );
    }

    const mapping = await createCustomMapping(clientId, {
      platformId,
      fieldType,
      canonicalId,
      platformFieldName,
      transformation,
    });

    res.status(201).json({ mapping });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/mappings/:mappingId
 * Update an existing custom mapping (requires editor role)
 */
router.put('/mappings/:mappingId', attachMappingClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { mappingId } = req.params;
    validateUUID(mappingId, 'mappingId');
    const { platformFieldName, transformation } = req.body;

    if (!platformFieldName && transformation === undefined) {
      throw new AppError('At least platformFieldName or transformation must be provided', 400);
    }

    const mapping = await updateCustomMapping(mappingId, {
      platformFieldName,
      transformation,
    });

    res.json({ mapping });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/mappings/:mappingId
 * Delete a custom mapping (reverts to system default) (requires editor role)
 */
router.delete('/mappings/:mappingId', attachMappingClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    validateUUID(req.params.mappingId, 'mappingId');
    await deleteCustomMapping(req.params.mappingId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:clientId/mappings/:platformId/reset
 * Reset all custom mappings for a platform (reverts to system defaults) (requires editor role)
 */
router.post('/clients/:clientId/mappings/:platformId/reset', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { clientId, platformId } = req.params;
    validateEntityId(clientId, 'clientId');
    const result = await resetPlatformMappings(clientId, platformId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
