/**
 * Client Routes
 *
 * CRUD operations for client management.
 * All routes require authentication; client-specific routes require client access.
 */

import { Router } from 'express';
import { supabaseService } from '../services/supabase.js';
import { AppError } from '../errors/AppError.js';
import { validateBody, params } from '../middleware/validateRequest.js';
import { validateClientCreate, validateClientUpdate } from '../validators/schemas/index.js';
import { success, created, notFound } from '../utils/response.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';
import { attachUserClientIds, filterByClientAccess } from '../middleware/userClients.js';

const router = Router();

// All client routes require authentication
router.use(requireAuth);

// GET /api/clients - List clients (filtered by user's access)
router.get('/', attachUserClientIds, async (req, res, next) => {
  try {
    const clients = await supabaseService.getClients();
    const filteredClients = filterByClientAccess(clients, req.userClientIds);
    success(res, { clients: filteredClients });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id - Get single client with full details
router.get('/:id', params.id, requireClientAccess, async (req, res, next) => {
  try {
    const client = await supabaseService.getClient(req.params.id);
    if (!client) {
      return notFound(res, 'Client', req.params.id);
    }
    success(res, { client });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients - Create new client
router.post('/', validateBody(validateClientCreate), async (req, res, next) => {
  try {
    const { name, email, industry, status, notes } = req.body;

    const client = await supabaseService.createClient({
      name: name.trim(),
      email: email.trim(),
      industry: industry || 'Other',
      status: status || 'onboarding',
      notes: notes?.trim() || '',
    });

    created(res, { client });
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id - Update client (requires editor role)
router.put('/:id', params.id, requireClientAccess, requireMinimumRole('editor'), validateBody(validateClientUpdate), async (req, res, next) => {
  try {
    const { name, email, industry, status, notes } = req.body;

    const client = await supabaseService.updateClient(req.params.id, {
      name: name?.trim(),
      email: email?.trim(),
      industry,
      status,
      notes: notes?.trim(),
    });

    if (!client) {
      return notFound(res, 'Client', req.params.id);
    }

    success(res, { client });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clients/:id - Delete client (requires admin role, cascade deletes all related entities)
router.delete('/:id', params.id, requireClientAccess, requireMinimumRole('admin'), async (req, res, next) => {
  try {
    const deleted = await supabaseService.deleteClient(req.params.id);
    if (!deleted) {
      throw AppError.notFound('Client', req.params.id);
    }
    success(res, { success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id/sources - Get client's data sources
router.get('/:id/sources', params.id, requireClientAccess, async (req, res, next) => {
  try {
    const sources = await supabaseService.getClientSources(req.params.id);
    success(res, { sources });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/sources - Add data source to client (requires editor role)
router.post('/:id/sources', params.id, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const source = await supabaseService.createSource(req.params.id, req.body);
    created(res, { source });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id/etl - Get client's ETL processes
router.get('/:id/etl', params.id, requireClientAccess, async (req, res, next) => {
  try {
    const etlProcesses = await supabaseService.getClientETLProcesses(req.params.id);
    success(res, { etlProcesses });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/etl - Create ETL process for client (requires editor role)
router.post('/:id/etl', params.id, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const etlProcess = await supabaseService.createETLProcess(req.params.id, req.body);
    created(res, { etlProcess });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id/kpis - Get client's KPIs
router.get('/:id/kpis', params.id, requireClientAccess, async (req, res, next) => {
  try {
    const kpis = await supabaseService.getClientKPIs(req.params.id);
    success(res, { kpis });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/kpis - Create KPI for client (requires editor role)
router.post('/:id/kpis', params.id, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const kpi = await supabaseService.createKPI(req.params.id, req.body);
    created(res, { kpi });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id/reports - Get client's reports
router.get('/:id/reports', params.id, requireClientAccess, async (req, res, next) => {
  try {
    const reports = await supabaseService.getClientReports(req.params.id);
    success(res, { reports });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/reports - Create report for client (requires editor role)
router.post('/:id/reports', params.id, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const report = await supabaseService.createReport(req.params.id, req.body);
    created(res, { report });
  } catch (error) {
    next(error);
  }
});

export default router;
