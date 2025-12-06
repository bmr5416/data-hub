import { Router } from 'express';
import { kpiRepository } from '../services/repositories/index.js';
import { AppError } from '../errors/AppError.js';
import { validateEntityId } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';
import { attachUserClientIds, filterByClientAccess } from '../middleware/userClients.js';

const router = Router();

// All KPI routes require authentication
router.use(requireAuth);

/**
 * Middleware to look up KPI and attach client_id for authorization
 */
async function attachKPIClientId(req, res, next) {
  try {
    const kpiId = req.params.id;
    if (!kpiId) return next();

    const validatedId = validateEntityId(kpiId, 'kpiId');
    const kpi = await kpiRepository.findById(validatedId);
    if (!kpi) {
      throw new AppError('KPI not found', 404);
    }

    // Attach client_id for requireClientAccess to use
    req.params.clientId = kpi.clientId;
    req.kpi = kpi;
    next();
  } catch (error) {
    next(error);
  }
}

const VALID_CATEGORIES = ['acquisition', 'engagement', 'conversion', 'retention', 'revenue', 'efficiency', 'other'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];

function validateKPIData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('KPI name is required');
    }
  }

  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (data.reportingFrequency && !VALID_FREQUENCIES.includes(data.reportingFrequency)) {
    errors.push(`Invalid reporting frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`);
  }

  return errors;
}

// GET /api/kpis - List KPIs (filtered by user's access)
router.get('/', attachUserClientIds, async (req, res, next) => {
  try {
    const kpis = await kpiRepository.findAll();
    const filteredKpis = filterByClientAccess(kpis, req.userClientIds);
    res.json({ kpis: filteredKpis });
  } catch (error) {
    next(error);
  }
});

// GET /api/kpis/:id - Get KPI details
router.get('/:id', attachKPIClientId, requireClientAccess, async (req, res, next) => {
  try {
    // KPI already fetched by middleware
    res.json({ kpi: req.kpi });
  } catch (error) {
    next(error);
  }
});

// PUT /api/kpis/:id - Update KPI (requires editor role)
router.put('/:id', attachKPIClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const kpiId = validateEntityId(req.params.id, 'kpiId');
    const validationErrors = validateKPIData(req.body, true);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const kpi = await kpiRepository.update(kpiId, req.body);
    if (!kpi) {
      throw new AppError('KPI not found', 404);
    }

    res.json({ kpi });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/kpis/:id - Delete KPI (requires admin role)
router.delete('/:id', attachKPIClientId, requireClientAccess, requireMinimumRole('admin'), async (req, res, next) => {
  try {
    const kpiId = validateEntityId(req.params.id, 'kpiId');
    const deleted = await kpiRepository.delete(kpiId);
    if (!deleted) {
      throw new AppError('KPI not found', 404);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
