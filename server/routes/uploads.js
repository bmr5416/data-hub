import { Router } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import clientDataService from '../services/clientDataService.js';
import blendingService from '../services/blendingService.js';
import { clientRepository, warehouseRepository } from '../services/repositories/index.js';
import { AppError } from '../errors/AppError.js';
import { getPlatformById } from '../data/platforms.js';
import { getRequestLogger } from '../middleware/requestId.js';
import { validateUUID, validateEntityId } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';

const router = Router();

// All upload routes require authentication
router.use(requireAuth);

// Configure multer for file uploads (memory storage for parsing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check extension (case-insensitive)
    const hasCSVExtension = file.originalname.toLowerCase().endsWith('.csv');
    if (!hasCSVExtension) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
});

/**
 * Validate CSV content structure
 * Returns { valid: boolean, error?: string, headers?: string[] }
 */
function validateCSVContent(buffer) {
  try {
    // Check for empty file
    if (buffer.length === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Read first 4KB to check structure (enough for headers + some rows)
    const sample = buffer.toString('utf-8', 0, Math.min(4096, buffer.length));

    // Check for binary content (null bytes indicate non-text)
    if (sample.includes('\0')) {
      return { valid: false, error: 'File contains binary data, not valid CSV' };
    }

    // Parse just the first few lines to validate structure
    const parseResult = Papa.parse(sample, {
      header: true,
      preview: 3, // Only parse first 3 rows
      skipEmptyLines: true,
    });

    // Check for parsing errors
    if (parseResult.errors.length > 0) {
      const firstError = parseResult.errors[0];
      return { valid: false, error: `CSV parsing error: ${firstError.message}` };
    }

    // Check that we have headers
    const headers = parseResult.meta.fields || [];
    if (headers.length === 0) {
      return { valid: false, error: 'CSV has no headers' };
    }

    // Check for at least one valid header (not empty)
    const validHeaders = headers.filter((h) => h && h.trim().length > 0);
    if (validHeaders.length === 0) {
      return { valid: false, error: 'CSV headers are all empty' };
    }

    return { valid: true, headers: validHeaders };
  } catch (err) {
    return { valid: false, error: `Failed to validate CSV: ${err.message}` };
  }
}

/**
 * GET /api/clients/:clientId/data
 * Get workbook info for a client
 */
router.get('/clients/:clientId/data', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');

    // Get client to verify it exists
    const client = await clientRepository.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Check if client has a warehouse (platform data config)
    const warehouses = await warehouseRepository.findByClientId(clientId);
    const warehouse = warehouses[0] || null;

    if (!warehouse) {
      return res.json({
        hasPlatformData: false,
        clientId,
        clientName: client.name,
      });
    }

    // Get platform data info with uploads
    const platformDataInfo = await clientDataService.getWorkbookInfo(warehouse.id);

    res.json({
      hasPlatformData: true,
      clientId,
      clientName: client.name,
      ...platformDataInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:clientId/data
 * Create a new workbook (data workspace) for a client (requires editor role)
 */
router.post('/clients/:clientId/data', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');

    // Get client to verify it exists
    const client = await clientRepository.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Check if client already has a workbook
    const existingWarehouses = await warehouseRepository.findByClientId(clientId);
    const existingWarehouse = existingWarehouses[0] || null;

    if (existingWarehouse) {
      throw new AppError('Client already has a workbook', 400);
    }

    // Create new workbook (warehouse config)
    const workbook = await clientDataService.createClientWorkbook(clientId, client.name);

    res.status(201).json({
      success: true,
      ...workbook,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:clientId/data/platforms
 * Add a platform to the client's workbook (requires editor role)
 */
router.post('/clients/:clientId/data/platforms', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const { platformId, schema } = req.body;

    if (!platformId) {
      throw new AppError('Platform ID is required', 400);
    }

    // Validate platform
    const platform = getPlatformById(platformId);
    if (!platform && platformId !== 'custom') {
      throw new AppError(`Unknown platform: ${platformId}`, 400);
    }

    // Get client's warehouse
    const warehouses = await warehouseRepository.findByClientId(clientId);
    const warehouse = warehouses[0] || null;

    if (!warehouse) {
      throw new AppError('Client does not have a workbook. Create one first.', 400);
    }

    // Add platform to workspace
    const platformInfo = await clientDataService.addSourceTab(warehouse.id, platformId, schema);

    res.status(201).json({
      success: true,
      ...platformInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:clientId/data/platforms/:platformId
 * Remove a platform from the client's workbook (requires editor role)
 */
router.delete('/clients/:clientId/data/platforms/:platformId', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const { platformId } = req.params;

    // Get client's warehouse
    const warehouses = await warehouseRepository.findByClientId(clientId);
    const warehouse = warehouses[0] || null;

    if (!warehouse) {
      throw new AppError('Client does not have a workbook', 404);
    }

    // Remove platform from workspace
    await clientDataService.removePlatform(warehouse.id, platformId, clientId);

    res.json({
      success: true,
      message: `Platform "${platformId}" removed from workspace`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:clientId/data/upload/:platformId
 * Upload CSV data for a platform (requires editor role)
 */
router.post(
  '/clients/:clientId/data/upload/:platformId',
  requireClientAccess,
  requireMinimumRole('editor'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      const clientId = validateEntityId(req.params.clientId, 'clientId');
      const { platformId } = req.params;

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      // Validate platform
      const platform = getPlatformById(platformId);
      if (!platform && platformId !== 'custom') {
        throw new AppError(`Unknown platform: ${platformId}`, 400);
      }

      // Get client's warehouse
      const warehouses = await warehouseRepository.findByClientId(clientId);
      const warehouse = warehouses[0] || null;

      if (!warehouse) {
        throw new AppError('Client does not have a workbook. Create one first.', 400);
      }

      // Check if platform is added to workspace
      if (!warehouse.platforms.includes(platformId)) {
        throw new AppError(`Platform "${platformId}" not added to workspace. Add it first.`, 400);
      }

      // Validate CSV content before full parse
      const validation = validateCSVContent(req.file.buffer);
      if (!validation.valid) {
        throw new AppError(validation.error, 400);
      }

      // Parse CSV file
      const csvContent = req.file.buffer.toString('utf-8');
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        const errorMessages = parseResult.errors.slice(0, 3).map((e) => e.message);
        throw new AppError(`CSV parsing errors: ${errorMessages.join(', ')}`, 400);
      }

      const rows = parseResult.data;
      const headers = parseResult.meta.fields || [];

      if (rows.length === 0) {
        throw new AppError('CSV file is empty or has no valid data rows', 400);
      }

      // Process and store the upload
      const result = await clientDataService.processUpload(
        clientId,
        platformId,
        req.file.originalname,
        rows,
        headers
      );

      res.status(201).json({
        success: true,
        filename: req.file.originalname,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clients/:clientId/data/uploads
 * Get all uploads for a client
 */
router.get('/clients/:clientId/data/uploads', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const { platformId } = req.query;

    const uploads = await clientDataService.getUploads(clientId, platformId || null);

    res.json({
      clientId,
      platformId: platformId || null,
      uploads,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:clientId/data/uploads/:uploadId
 * Delete an upload and its data (requires editor role)
 */
router.delete('/clients/:clientId/data/uploads/:uploadId', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    validateEntityId(req.params.clientId, 'clientId');
    const uploadId = validateUUID(req.params.uploadId, 'uploadId');

    await clientDataService.deleteUpload(uploadId);

    res.json({
      success: true,
      message: 'Upload deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/data/validate
 * Validate uploaded data for platforms
 */
router.get('/clients/:clientId/data/validate', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const { platformId } = req.query;

    // Get client's warehouse
    const warehouses = await warehouseRepository.findByClientId(clientId);
    const warehouse = warehouses[0] || null;

    if (!warehouse) {
      throw new AppError('Client does not have a workbook', 400);
    }

    if (platformId) {
      // Validate specific platform
      const validation = await clientDataService.validateSourceData(clientId, platformId);
      res.json(validation);
    } else {
      // Validate all platforms
      const validations = {};

      for (const pId of warehouse.platforms) {
        validations[pId] = await clientDataService.validateSourceData(clientId, pId);
      }

      res.json({
        warehouseId: warehouse.id,
        validations,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients/:clientId/data/blend
 * Generate blended data from all uploaded sources (requires editor role)
 */
router.post('/clients/:clientId/data/blend', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const { groupBy } = req.body;

    // Get client's warehouse
    const warehouses = await warehouseRepository.findByClientId(clientId);
    const warehouse = warehouses[0] || null;

    if (!warehouse) {
      throw new AppError('Client does not have a workbook', 400);
    }

    if (warehouse.platforms.length === 0) {
      throw new AppError('No platforms configured. Add platforms first.', 400);
    }

    // Collect data from all platforms
    const sources = [];

    const logger = getRequestLogger(req);
    for (const platformId of warehouse.platforms) {
      try {
        const data = await clientDataService.getSourceData(clientId, platformId);
        if (data.length > 0) {
          sources.push({ platformId, data });
        }
      } catch (err) {
        logger.warn(`Could not read data for platform ${platformId}`, { error: err.message });
      }
    }

    if (sources.length === 0) {
      throw new AppError('No source data found. Upload data to platforms first.', 400);
    }

    // Blend the data
    let blendedData = blendingService.blendSources(sources);

    // Aggregate if requested
    if (groupBy && Array.isArray(groupBy) && groupBy.length > 0) {
      blendedData = blendingService.aggregateData(blendedData, groupBy);
    }

    // Get summary stats
    const stats = blendingService.getSummaryStats(blendedData);

    // Write blended data to Supabase
    const writeResult = await clientDataService.writeBlendedData(
      clientId,
      blendedData,
      sources.map((s) => s.platformId)
    );

    res.json({
      success: true,
      rowsBlended: blendedData.length,
      sourcesBlended: sources.map((s) => s.platformId),
      stats,
      batchId: writeResult.batchId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/data/blended
 * Get blended data for a client
 */
router.get('/clients/:clientId/data/blended', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');

    const blendedData = await clientDataService.getBlendedData(clientId);

    res.json({
      clientId,
      rowCount: blendedData.length,
      data: blendedData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/data/schema/:platformId
 * Get the default schema for a platform
 */
router.get('/clients/:clientId/data/schema/:platformId', requireClientAccess, async (req, res, next) => {
  try {
    validateEntityId(req.params.clientId, 'clientId');
    const { platformId } = req.params;

    const schema = clientDataService.getDefaultSchema(platformId);

    if (!schema) {
      throw new AppError(`No schema available for platform: ${platformId}`, 404);
    }

    res.json(schema);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/blended-schema
 * Get the blended data column schema
 */
router.get('/blended-schema', async (req, res, next) => {
  try {
    const schema = blendingService.getBlendedSchema();
    res.json(schema);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/data/data/:platformId/preview
 * Get preview of platform data with pagination
 */
router.get('/clients/:clientId/data/data/:platformId/preview', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const { platformId } = req.params;
    // Validate pagination with bounds checking
    const MAX_LIMIT = 1000;
    const MAX_OFFSET = 100000;
    const limit = req.query.limit === 'all' ? null : Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), MAX_LIMIT);
    const offset = Math.min(Math.max(parseInt(req.query.offset, 10) || 0, 0), MAX_OFFSET);

    // Validate platform exists
    const platform = getPlatformById(platformId);
    if (!platform && platformId !== 'custom') {
      throw new AppError(`Unknown platform: ${platformId}`, 400);
    }

    const result = await clientDataService.getDataPreview(clientId, platformId, limit, offset);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:clientId/data/blended/preview
 * Get preview of blended data with pagination
 */
router.get('/clients/:clientId/data/blended/preview', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    // Validate pagination with bounds checking
    const MAX_LIMIT = 1000;
    const MAX_OFFSET = 100000;
    const limit = req.query.limit === 'all' ? null : Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), MAX_LIMIT);
    const offset = Math.min(Math.max(parseInt(req.query.offset, 10) || 0, 0), MAX_OFFSET);

    const result = await clientDataService.getBlendedDataPreview(clientId, limit, offset);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
