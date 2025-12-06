import express from 'express';
import warehouseService from '../services/warehouseService.js';
import { clientRepository, warehouseRepository } from '../services/repositories/index.js';
import { AppError } from '../errors/AppError.js';
import {
  validateEntityId,
  validateWarehouseCreate,
  validateWarehouseUpdate
} from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';

const router = express.Router();

// All warehouse routes require authentication
router.use(requireAuth);

/**
 * Middleware to look up warehouse and attach client_id for authorization
 */
async function attachWarehouseClientId(req, res, next) {
  try {
    const warehouseId = req.params.warehouseId;
    if (!warehouseId) return next();

    const validatedId = validateEntityId(warehouseId, 'warehouseId');
    const warehouse = await warehouseService.getWarehouse(validatedId);
    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    // Attach client_id for requireClientAccess to use
    req.params.clientId = warehouse.clientId;
    req.warehouse = warehouse;
    next();
  } catch (error) {
    next(error);
  }
}

// List warehouses for a client
router.get('/clients/:clientId/warehouses', requireClientAccess, async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const warehouses = await warehouseRepository.findByClientId(clientId);
    res.json({ warehouses });
  } catch (error) {
    next(error);
  }
});

// Get warehouse details
router.get('/warehouses/:warehouseId', attachWarehouseClientId, requireClientAccess, async (req, res, next) => {
  try {
    // Warehouse already fetched by middleware
    res.json({ warehouse: req.warehouse });
  } catch (error) {
    next(error);
  }
});

// Create warehouse (requires editor role)
router.post('/clients/:clientId/warehouses', requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const clientId = validateEntityId(req.params.clientId, 'clientId');
    const { name, platforms, fieldSelections, includeBlendedTable } = validateWarehouseCreate(req.body);

    // Get client name for warehouse naming
    const client = await clientRepository.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const warehouse = await warehouseService.createWarehouse({
      clientId,
      clientName: client.name,
      name,
      platforms,
      fieldSelections,
      includeBlendedTable: includeBlendedTable !== false, // Default true
    });

    res.status(201).json({ warehouse });
  } catch (error) {
    next(error);
  }
});

// Update warehouse (requires editor role)
router.put('/warehouses/:warehouseId', attachWarehouseClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const warehouseId = validateEntityId(req.params.warehouseId, 'warehouseId');
    const updates = validateWarehouseUpdate(req.body);

    const warehouse = await warehouseRepository.update(warehouseId, updates);

    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    res.json({ warehouse });
  } catch (error) {
    next(error);
  }
});

// Delete warehouse (requires admin role)
// NOTE: Warehouse deletion is intentionally not implemented to prevent accidental data loss.
router.delete('/warehouses/:warehouseId', attachWarehouseClientId, requireClientAccess, requireMinimumRole('admin'), async (req, res, next) => {
  try {
    validateEntityId(req.params.warehouseId, 'warehouseId');
    throw new AppError('Warehouse deletion not implemented to prevent accidental data loss.', 501);
  } catch (error) {
    next(error);
  }
});

// Get warehouse schema
router.get('/warehouses/:warehouseId/schema', attachWarehouseClientId, requireClientAccess, async (req, res, next) => {
  try {
    const warehouseId = validateEntityId(req.params.warehouseId, 'warehouseId');
    const schema = await warehouseService.getWarehouseSchema(warehouseId);

    if (!schema) {
      throw new AppError('Warehouse not found', 404);
    }

    res.json({ schema });
  } catch (error) {
    next(error);
  }
});

// Get warehouse statistics
router.get('/warehouses/:warehouseId/stats', attachWarehouseClientId, requireClientAccess, async (req, res, next) => {
  try {
    const warehouseId = validateEntityId(req.params.warehouseId, 'warehouseId');
    const stats = await warehouseService.getWarehouseStats(warehouseId);

    if (!stats) {
      throw new AppError('Warehouse not found', 404);
    }

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router;
