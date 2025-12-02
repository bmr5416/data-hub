import { Router } from 'express';
import { supabaseService } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateUUID } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';
import { attachUserClientIds, filterByClientAccess } from '../middleware/userClients.js';

const router = Router();

// All source routes require authentication
router.use(requireAuth);

const VALID_PLATFORMS = [
  'ga4', 'meta_ads', 'google_ads', 'shopify', 'klaviyo', 'tiktok', 'pinterest',
  'linkedin', 'twitter', 'bing_ads', 'amazon_ads', 'criteo', 'dv360', 'cm360',
  'sa360', 'appsflyer', 'branch', 'adjust', 'braze', 'iterable', 'attentive',
  'postscript', 'gorgias', 'zendesk', 'stripe', 'recurly', 'recharge',
  'triple_whale', 'northbeam', 'rockerbox', 'salesforce', 'hubspot', 'segment',
  'snowflake', 'bigquery', 'redshift', 'amplitude', 'mixpanel', 'other'
];

const VALID_SOURCE_TYPES = ['warehouse', 'analytics', 'crm', 'cdp', 'advertising', 'ecommerce', 'email', 'attribution', 'support', 'payments', 'other'];
const VALID_CONNECTION_METHODS = ['api', 'manual_upload', 'fivetran', 'stitch', 'airbyte', 'custom_etl', 'other'];
const VALID_REFRESH_FREQUENCIES = ['realtime', 'hourly', 'daily', 'weekly', 'manual'];
const VALID_STATUSES = ['connected', 'pending', 'error', 'disconnected'];

function validateSourceData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('Source name is required');
    }
  }

  if (!isUpdate || data.platform !== undefined) {
    if (!data.platform) {
      errors.push('Platform is required');
    } else if (!VALID_PLATFORMS.includes(data.platform)) {
      errors.push(`Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`);
    }
  }

  if (data.sourceType && !VALID_SOURCE_TYPES.includes(data.sourceType)) {
    errors.push(`Invalid source type. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  if (data.connectionMethod && !VALID_CONNECTION_METHODS.includes(data.connectionMethod)) {
    errors.push(`Invalid connection method. Must be one of: ${VALID_CONNECTION_METHODS.join(', ')}`);
  }

  if (data.refreshFrequency && !VALID_REFRESH_FREQUENCIES.includes(data.refreshFrequency)) {
    errors.push(`Invalid refresh frequency. Must be one of: ${VALID_REFRESH_FREQUENCIES.join(', ')}`);
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return errors;
}

/**
 * Middleware to look up source and attach client_id for authorization
 */
async function attachSourceClientId(req, res, next) {
  try {
    const sourceId = req.params.id;
    if (!sourceId) return next();

    validateUUID(sourceId, 'sourceId');
    const source = await supabaseService.getSource(sourceId);
    if (!source) {
      throw AppError.notFound('Source', sourceId);
    }

    // Attach client_id for requireClientAccess to use
    req.params.clientId = source.clientId;
    req.source = source;
    next();
  } catch (error) {
    next(error);
  }
}

// GET /api/sources - List sources (filtered by user's access)
router.get('/', attachUserClientIds, async (req, res, next) => {
  try {
    const sources = await supabaseService.getAllSources();
    const filteredSources = filterByClientAccess(sources, req.userClientIds);
    res.json({ sources: filteredSources });
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:id - Get source details
router.get('/:id', attachSourceClientId, requireClientAccess, async (req, res, next) => {
  try {
    // Source already fetched by middleware
    res.json({ source: req.source });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sources/:id - Update source (requires editor role)
router.put('/:id', attachSourceClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const sourceId = validateUUID(req.params.id, 'sourceId');
    const validationErrors = validateSourceData(req.body, true);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const source = await supabaseService.updateSource(sourceId, req.body);
    if (!source) {
      throw new AppError('Source not found', 404);
    }

    res.json({ source });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sources/:id - Delete source (requires editor role)
router.delete('/:id', attachSourceClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const sourceId = validateUUID(req.params.id, 'sourceId');
    const deleted = await supabaseService.deleteSource(sourceId);
    if (!deleted) {
      throw new AppError('Source not found', 404);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
