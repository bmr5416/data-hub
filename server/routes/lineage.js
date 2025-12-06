import { Router } from 'express';
import { lineageRepository } from '../services/repositories/index.js';
import { AppError } from '../errors/AppError.js';
import { validateEntityId } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';

const router = Router();

// All lineage routes require authentication
router.use(requireAuth);

/**
 * Middleware to look up lineage and attach client_id for authorization
 */
async function attachLineageClientId(req, res, next) {
  try {
    const lineageId = req.params.id;
    if (!lineageId) return next();

    const validatedId = validateEntityId(lineageId, 'lineageId');
    const lineage = await lineageRepository.findById(validatedId);
    if (!lineage) {
      throw new AppError('Lineage connection not found', 404);
    }

    // Attach client_id for requireClientAccess to use
    req.params.clientId = lineage.clientId;
    req.lineage = lineage;
    next();
  } catch (error) {
    next(error);
  }
}

const VALID_DESTINATION_TYPES = ['etl', 'kpi', 'report'];

function validateLineageData(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('Client ID is required');
  }

  if (!data.sourceId) {
    errors.push('Source ID is required');
  }

  if (!data.destinationType) {
    errors.push('Destination type is required');
  } else if (!VALID_DESTINATION_TYPES.includes(data.destinationType)) {
    errors.push(`Invalid destination type. Must be one of: ${VALID_DESTINATION_TYPES.join(', ')}`);
  }

  if (!data.destinationId) {
    errors.push('Destination ID is required');
  }

  return errors;
}

// GET /api/lineage/:clientId - Get lineage graph for client
router.get('/:clientId', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const lineage = await lineageRepository.findByClientId(clientId);
    res.json({ lineage });
  } catch (error) {
    next(error);
  }
});

/**
 * Middleware to extract clientId from body for lineage creation
 */
function extractClientIdFromBody(req, res, next) {
  if (req.body.clientId) {
    req.params.clientId = req.body.clientId;
  }
  next();
}

// POST /api/lineage - Create lineage connection (requires editor role)
router.post('/', extractClientIdFromBody, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const validationErrors = validateLineageData(req.body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const lineage = await lineageRepository.create(req.body);

    res.status(201).json({ lineage });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/lineage/:id - Remove lineage connection (requires editor role)
router.delete('/:id', attachLineageClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const lineageId = validateEntityId(req.params.id, 'lineageId');
    const deleted = await lineageRepository.delete(lineageId);
    if (!deleted) {
      throw new AppError('Lineage connection not found', 404);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
