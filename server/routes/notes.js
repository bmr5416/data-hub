import { Router } from 'express';
import { supabaseService } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateUUID, validateEntityId } from '../services/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClientAccess, requireMinimumRole } from '../middleware/clientAccess.js';

const router = Router();

// All notes routes require authentication
router.use(requireAuth);

const VALID_ENTITY_TYPES = ['source', 'etl', 'kpi', 'report', 'client'];

/**
 * Middleware to look up entity and attach client_id for authorization
 * Notes can be attached to different entity types, each with their own parent client
 */
async function attachNoteEntityClientId(req, res, next) {
  try {
    const { entityType, entityId } = req.params;

    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      throw new AppError(`Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`, 400);
    }

    const validatedEntityId = entityType === 'client'
      ? validateEntityId(entityId, 'entityId')
      : validateUUID(entityId, 'entityId');

    // For client type, the entityId IS the clientId
    if (entityType === 'client') {
      req.params.clientId = validatedEntityId;
      return next();
    }

    // For other types, look up the parent entity to get clientId
    let entity;
    switch (entityType) {
      case 'source':
        entity = await supabaseService.getSource(validatedEntityId);
        break;
      case 'etl':
        entity = await supabaseService.getETLProcess(validatedEntityId);
        break;
      case 'kpi':
        entity = await supabaseService.getKPI(validatedEntityId);
        break;
      case 'report':
        entity = await supabaseService.getEnhancedReport(validatedEntityId);
        break;
    }

    if (!entity) {
      throw new AppError(`${entityType} not found`, 404);
    }

    req.params.clientId = entity.clientId;
    req.entity = entity;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate entityId based on entityType
 */
function validateEntityIdByType(entityType, entityId) {
  if (entityType === 'client') {
    return validateEntityId(entityId, 'entityId');
  }
  return validateUUID(entityId, 'entityId');
}

/**
 * GET /api/notes/:entityType/:entityId
 * Get notes for an entity
 */
router.get('/:entityType/:entityId', attachNoteEntityClientId, requireClientAccess, async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const entityId = validateEntityIdByType(entityType, req.params.entityId);
    const notes = await supabaseService.getNotes(entityType, entityId);
    res.json({ notes });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notes/:entityType/:entityId
 * Save or update a note for an entity (requires editor role)
 * Body: { note, updatedBy? }
 */
router.post('/:entityType/:entityId', attachNoteEntityClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const { note, updatedBy } = req.body;

    const entityId = validateEntityIdByType(entityType, req.params.entityId);

    if (note === undefined) {
      throw new AppError('Note content is required', 400);
    }

    const result = await supabaseService.saveNote(entityType, entityId, { note, updatedBy });
    res.json({ note: result });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notes/:entityType/:entityId
 * Delete a note for an entity (requires editor role)
 */
router.delete('/:entityType/:entityId', attachNoteEntityClientId, requireClientAccess, requireMinimumRole('editor'), async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const entityId = validateEntityIdByType(entityType, req.params.entityId);
    const deleted = await supabaseService.deleteNote(entityType, entityId);
    if (!deleted) {
      throw new AppError('Note not found', 404);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
