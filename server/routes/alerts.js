/**
 * KPI Alerts API Routes
 *
 * Handles CRUD operations for KPI threshold alerts and trigger history.
 * All routes require authentication and verify client access through parent KPI.
 */

import { Router } from 'express';
import { kpiRepository, kpiAlertRepository } from '../services/repositories/index.js';
import { evaluateKPIAlerts } from '../services/alertEvaluator.js';
import { AppError } from '../errors/AppError.js';
import { validateUUID } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';

const router = Router();

// All alert routes require authentication
router.use(requireAuth);

// Valid alert conditions
const VALID_CONDITIONS = ['above_threshold', 'below_threshold', 'equals', 'percent_change'];

/**
 * Middleware to look up KPI and attach client_id for authorization
 * Must be used before requireClientAccess for KPI-based routes
 */
async function attachKpiClientId(req, res, next) {
  try {
    const kpiId = req.params.kpiId;
    if (!kpiId) return next();

    validateUUID(kpiId, 'kpiId');
    const kpi = await kpiRepository.findById(kpiId);
    if (!kpi) {
      throw AppError.notFound('KPI', kpiId);
    }

    // Attach client_id for requireClientAccess to use
    req.params.id = kpi.clientId;
    req.kpi = kpi;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to look up alert -> KPI and attach client_id for authorization
 * Must be used before requireClientAccess for alert-based routes
 */
async function attachAlertClientId(req, res, next) {
  try {
    const alertId = req.params.alertId;
    if (!alertId) return next();

    validateUUID(alertId, 'alertId');
    const alert = await kpiAlertRepository.findById(alertId);
    if (!alert) {
      throw AppError.notFound('Alert', alertId);
    }

    // Get parent KPI to find client_id
    const kpi = await kpiRepository.findById(alert.kpiId);
    if (!kpi) {
      throw AppError.notFound('KPI', alert.kpiId);
    }

    // Attach client_id for requireClientAccess to use
    req.params.id = kpi.clientId;
    req.alert = alert;
    req.kpi = kpi;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/kpis/:kpiId/alerts
 * List all alerts for a KPI
 */
router.get('/kpis/:kpiId/alerts', attachKpiClientId, requireClientAccess, async (req, res, next) => {
  try {
    const alerts = await kpiAlertRepository.findByKpiId(req.params.kpiId);
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/kpis/:kpiId/alerts
 * Create a new alert for a KPI (requires editor role)
 */
router.post('/kpis/:kpiId/alerts', attachKpiClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { kpiId } = req.params;
    const { condition, threshold, channels, recipients, active } = req.body;

    if (!condition || threshold === undefined) {
      throw new AppError('condition and threshold are required', 400);
    }

    if (!VALID_CONDITIONS.includes(condition)) {
      throw new AppError(`Invalid condition. Must be one of: ${VALID_CONDITIONS.join(', ')}`, 400);
    }

    const alert = await kpiAlertRepository.create({
      kpiId,
      condition,
      threshold,
      channels: channels || [],
      recipients: recipients || [],
      active: active !== false,
    });

    res.status(201).json({ alert });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/:alertId
 * Update an existing alert (requires editor role)
 */
router.put('/alerts/:alertId', attachAlertClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { condition, threshold, channels, recipients, active } = req.body;

    if (condition && !VALID_CONDITIONS.includes(condition)) {
      throw new AppError(`Invalid condition. Must be one of: ${VALID_CONDITIONS.join(', ')}`, 400);
    }

    const alert = await kpiAlertRepository.update(alertId, {
      condition,
      threshold,
      channels,
      recipients,
      active,
    });

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/alerts/:alertId
 * Delete an alert (requires editor role)
 */
router.delete('/alerts/:alertId', attachAlertClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    await kpiAlertRepository.delete(req.params.alertId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/:alertId/history
 * Get trigger history for an alert
 */
router.get('/alerts/:alertId/history', attachAlertClientId, requireClientAccess, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const history = await kpiAlertRepository.findHistory(req.params.alertId, limit);
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/evaluate/:kpiId
 * Manually trigger alert evaluation for a KPI (requires editor role)
 */
router.post('/alerts/evaluate/:kpiId', attachKpiClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { kpiId } = req.params;
    const { currentValue } = req.body;

    if (currentValue === undefined) {
      throw new AppError('currentValue is required', 400);
    }

    const parsedValue = parseFloat(currentValue);
    if (isNaN(parsedValue)) {
      throw new AppError('currentValue must be a valid number', 400);
    }

    const results = await evaluateKPIAlerts(kpiId, parsedValue);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
