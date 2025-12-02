import { Router } from 'express';
import { supabaseService } from '../services/supabase.js';
import { reportService } from '../services/reportService.js';
import { reportAlertService } from '../services/reportAlertService.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateEntityId } from '../services/validators.js';
import { heavyLimiter } from '../middleware/rateLimiter.js';
import { extendedTimeout } from '../middleware/timeout.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';
import { attachUserClientIds, filterByClientAccess } from '../middleware/userClients.js';

// Report routes with prefixed ID support
const router = Router();

// All report routes require authentication
router.use(requireAuth);

/**
 * Middleware to look up report and attach client_id for authorization
 * Must be used before requireClientAccess for report-based routes
 */
async function attachReportClientId(req, res, next) {
  try {
    const reportId = req.params.id;
    if (!reportId) return next();

    const validatedId = validateEntityId(reportId, 'reportId');
    const report = await supabaseService.getEnhancedReport(validatedId);
    if (!report) {
      throw AppError.notFound('Report', reportId);
    }

    // Attach client_id for requireClientAccess to use
    req.params.clientId = report.clientId;
    req.report = report;
    next();
  } catch (error) {
    next(error);
  }
}

const VALID_TYPES = ['dashboard', 'scheduled_email', 'ad_hoc', 'automated', 'builder', 'other'];
const VALID_TOOLS = ['looker', 'tableau', 'powerbi', 'google_sheets', 'data_studio', 'data_hub', 'custom', 'other'];
const VALID_FREQUENCIES = ['realtime', 'daily', 'weekly', 'monthly', 'on_demand'];

function validateReportData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('Report name is required');
    }
  }

  if (data.type && !VALID_TYPES.includes(data.type)) {
    errors.push(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  if (data.tool && !VALID_TOOLS.includes(data.tool)) {
    errors.push(`Invalid tool. Must be one of: ${VALID_TOOLS.join(', ')}`);
  }

  if (data.frequency && !VALID_FREQUENCIES.includes(data.frequency)) {
    errors.push(`Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}`);
  }

  return errors;
}

// GET /api/reports - List reports (filtered by user's access)
router.get('/', attachUserClientIds, async (req, res, next) => {
  try {
    const reports = await supabaseService.getAllReports();
    const filteredReports = filterByClientAccess(reports, req.userClientIds);
    res.json({ reports: filteredReports });
  } catch (error) {
    next(error);
  }
});

// POST /api/reports - Create a new report (requires client access + editor role)
router.post('/', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const validationErrors = validateReportData(req.body);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const { clientId } = req.body;
    if (!clientId) {
      throw new AppError('Client ID is required', 400);
    }
    const validatedClientId = validateEntityId(clientId, 'clientId');

    const report = await supabaseService.createEnhancedReport(validatedClientId, req.body);
    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id - Get report details
router.get('/:id', attachReportClientId, requireClientAccess, async (req, res, next) => {
  try {
    // Report already fetched by attachReportClientId middleware
    res.json({ report: req.report });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reports/:id - Update report (requires editor role)
router.put('/:id', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const validationErrors = validateReportData(req.body, true);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const report = await supabaseService.updateEnhancedReport(reportId, req.body);
    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reports/:id - Delete report (requires admin role)
router.delete('/:id', attachReportClientId, requireClientAccess, requireMinimumRole('admin'), async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const deleted = await supabaseService.deleteReport(reportId);
    if (!deleted) {
      throw new AppError('Report not found', 404);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ========== REPORT DELIVERY ENDPOINTS ==========

// GET /api/reports/:id/preview - Get report preview with data
// Heavy operation: PDF generation, data aggregation
router.get('/:id/preview', attachReportClientId, requireClientAccess, heavyLimiter, extendedTimeout, async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const preview = await reportService.getReportPreview(reportId);
    res.json({ preview });
  } catch (error) {
    if (error.message.includes('not found')) {
      throw new AppError(error.message, 404);
    }
    next(error);
  }
});

// POST /api/reports/:id/viz-preview - Get visualization preview data
router.post('/:id/viz-preview', attachReportClientId, requireClientAccess, async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const vizConfig = req.body;

    if (!vizConfig || !vizConfig.type) {
      throw new AppError('Visualization type is required', 400);
    }

    const previewData = await reportService.getVisualizationPreview(reportId, vizConfig);
    res.json(previewData);
  } catch (error) {
    if (error.message.includes('not found')) {
      throw new AppError(error.message, 404);
    }
    next(error);
  }
});

// POST /api/reports/:id/send - Send report to all recipients (requires editor role)
// Heavy operation: PDF generation, email sending
router.post('/:id/send', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), heavyLimiter, extendedTimeout, async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const result = await reportService.sendReport(reportId);
    res.json({
      success: true,
      message: 'Report sent successfully',
      ...result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      throw new AppError(error.message, 404);
    }
    if (error.message.includes('No recipients')) {
      throw new AppError(error.message, 400);
    }
    next(error);
  }
});

// POST /api/reports/:id/test-email - Send test email (requires editor role)
// Heavy operation: PDF generation, email sending
router.post('/:id/test-email', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), heavyLimiter, extendedTimeout, async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const { testEmail } = req.body;
    if (!testEmail) {
      throw new AppError('Test email address is required', 400);
    }

    const result = await reportService.sendReport(reportId, {
      isTest: true,
      testEmail,
    });

    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      ...result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      throw new AppError(error.message, 404);
    }
    next(error);
  }
});

// POST /api/reports/:id/schedule - Schedule report delivery (requires editor role)
router.post('/:id/schedule', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const { scheduleConfig } = req.body;
    if (!scheduleConfig) {
      throw new AppError('Schedule configuration is required', 400);
    }

    const report = await reportService.scheduleReport(reportId, scheduleConfig);
    res.json({
      success: true,
      message: 'Report scheduled successfully',
      report,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      throw new AppError(error.message, 404);
    }
    next(error);
  }
});

// DELETE /api/reports/:id/schedule - Unschedule report delivery (requires editor role)
router.delete('/:id/schedule', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const report = await reportService.unscheduleReport(reportId);
    res.json({
      success: true,
      message: 'Report unscheduled successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id/delivery-history - Get delivery history
router.get('/:id/delivery-history', attachReportClientId, requireClientAccess, async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const { limit = 50 } = req.query;
    const history = await supabaseService.getReportDeliveryHistory(
      reportId,
      parseInt(limit, 10)
    );
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

// ========== REPORT ALERTS ENDPOINTS ==========

// GET /api/reports/:id/alerts - Get alerts for a report
router.get('/:id/alerts', attachReportClientId, requireClientAccess, async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const alerts = await reportAlertService.getReportAlerts(reportId);
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

// POST /api/reports/:id/alerts - Create alert for a report (requires editor role)
router.post('/:id/alerts', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const alertData = {
      ...req.body,
      reportId,
    };
    const alert = await reportAlertService.createAlert(alertData);
    res.status(201).json({ alert });
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      throw new AppError(error.message, 400);
    }
    next(error);
  }
});

// GET /api/reports/:id/alerts/:alertId - Get specific alert
router.get('/:id/alerts/:alertId', attachReportClientId, requireClientAccess, async (req, res, next) => {
  try {
    const reportId = validateEntityId(req.params.id, 'reportId');
    const alertId = validateEntityId(req.params.alertId, 'alertId');
    const alert = await supabaseService.getReportAlert(alertId);
    if (!alert || alert.reportId !== reportId) {
      throw new AppError('Alert not found', 404);
    }
    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reports/:id/alerts/:alertId - Update alert (requires editor role)
router.put('/:id/alerts/:alertId', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    validateEntityId(req.params.id, 'reportId');
    const alertId = validateEntityId(req.params.alertId, 'alertId');
    const alert = await reportAlertService.updateAlert(alertId, req.body);
    if (!alert) {
      throw new AppError('Alert not found', 404);
    }
    res.json({ alert });
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      throw new AppError(error.message, 400);
    }
    next(error);
  }
});

// DELETE /api/reports/:id/alerts/:alertId - Delete alert (requires editor role)
router.delete('/:id/alerts/:alertId', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    validateEntityId(req.params.id, 'reportId');
    const alertId = validateEntityId(req.params.alertId, 'alertId');
    await reportAlertService.deleteAlert(alertId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/reports/:id/alerts/:alertId/test - Test alert (requires editor role)
router.post('/:id/alerts/:alertId/test', attachReportClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    validateEntityId(req.params.id, 'reportId');
    const alertId = validateEntityId(req.params.alertId, 'alertId');
    const result = await reportAlertService.testAlert(alertId);
    res.json({ result });
  } catch (error) {
    if (error.message.includes('not found')) {
      throw new AppError(error.message, 404);
    }
    next(error);
  }
});

// GET /api/reports/:id/alerts/:alertId/history - Get alert history
router.get('/:id/alerts/:alertId/history', attachReportClientId, requireClientAccess, async (req, res, next) => {
  try {
    validateEntityId(req.params.id, 'reportId');
    const alertId = validateEntityId(req.params.alertId, 'alertId');
    const { limit = 100 } = req.query;
    const history = await reportAlertService.getAlertHistory(
      alertId,
      parseInt(limit, 10)
    );
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

export default router;
