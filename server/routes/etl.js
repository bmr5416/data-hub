import { Router } from 'express';
import { etlRepository } from '../services/repositories/index.js';
import { AppError } from '../errors/AppError.js';
import { validateEntityId } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';
import { attachUserClientIds, filterByClientAccess } from '../middleware/userClients.js';

const router = Router();

// All ETL routes require authentication
router.use(requireAuth);

/**
 * Middleware to look up ETL process and attach client_id for authorization
 */
async function attachETLClientId(req, res, next) {
  try {
    const etlId = req.params.id;
    if (!etlId) return next();

    const validatedId = validateEntityId(etlId, 'etlId');
    const etlProcess = await etlRepository.findById(validatedId);
    if (!etlProcess) {
      throw new AppError('ETL process not found', 404);
    }

    // Attach client_id for requireClientAccess to use
    req.params.clientId = etlProcess.clientId;
    req.etlProcess = etlProcess;
    next();
  } catch (error) {
    next(error);
  }
}

const VALID_ORCHESTRATORS = ['airflow', 'dbt', 'prefect', 'fivetran', 'manual', 'custom', 'other'];
const VALID_STATUSES = ['active', 'paused', 'error', 'deprecated'];

function validateETLData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('ETL process name is required');
    }
  }

  if (data.orchestrator && !VALID_ORCHESTRATORS.includes(data.orchestrator)) {
    errors.push(`Invalid orchestrator. Must be one of: ${VALID_ORCHESTRATORS.join(', ')}`);
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return errors;
}

// GET /api/etl - List ETL processes (filtered by user's access)
router.get('/', attachUserClientIds, async (req, res, next) => {
  try {
    const etlProcesses = await etlRepository.findAll();
    const filteredProcesses = filterByClientAccess(etlProcesses, req.userClientIds);
    res.json({ etlProcesses: filteredProcesses });
  } catch (error) {
    next(error);
  }
});

// GET /api/etl/:id - Get ETL details
router.get('/:id', attachETLClientId, requireClientAccess, async (req, res, next) => {
  try {
    // ETL process already fetched by middleware
    res.json({ etlProcess: req.etlProcess });
  } catch (error) {
    next(error);
  }
});

// PUT /api/etl/:id - Update ETL process (requires editor role)
router.put('/:id', attachETLClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const etlId = validateEntityId(req.params.id, 'etlId');
    const validationErrors = validateETLData(req.body, true);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const etlProcess = await etlRepository.update(etlId, req.body);
    if (!etlProcess) {
      throw new AppError('ETL process not found', 404);
    }

    res.json({ etlProcess });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/etl/:id - Delete ETL process (requires editor role)
router.delete('/:id', attachETLClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const etlId = validateEntityId(req.params.id, 'etlId');
    const deleted = await etlRepository.delete(etlId);
    if (!deleted) {
      throw new AppError('ETL process not found', 404);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
