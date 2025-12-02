import { AppError } from '../middleware/errorHandler.js';

/**
 * UUID v4 regex pattern
 * We only accept v4 because we generate IDs with crypto.randomUUID()
 * which produces v4 UUIDs per Web Crypto API spec.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Entity ID pattern - accepts both:
 * - Prefixed format: c-XXXXXXXX, wh-XXXXXXXX, etc. (1-2 letter prefix + 8 hex chars)
 * - Standard UUID v4 format
 */
const ENTITY_ID_PATTERN = /^([a-z]{1,2}-[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

/**
 * Validate a value is a valid UUID
 */
export function validateUUID(value, fieldName = 'id') {
  if (!value || typeof value !== 'string') {
    throw new AppError(`${fieldName} is required`, 400);
  }
  if (!UUID_PATTERN.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
  return value;
}

/**
 * Validate a value is a valid entity ID (prefixed or UUID format)
 * Use this for client IDs, source IDs, etc. that use the c-XXXXXXXX format
 */
export function validateEntityId(value, fieldName = 'id') {
  if (!value || typeof value !== 'string') {
    throw new AppError(`${fieldName} is required`, 400);
  }
  if (!ENTITY_ID_PATTERN.test(value)) {
    throw new AppError(`${fieldName} must be a valid ID`, 400);
  }
  return value;
}

/**
 * Validate a required string field
 */
export function validateString(value, fieldName, options = {}) {
  const { required = true, minLength = 0, maxLength = 255 } = options;

  if (required && (value === undefined || value === null || value === '')) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (value !== undefined && value !== null) {
    if (typeof value !== 'string') {
      throw new AppError(`${fieldName} must be a string`, 400);
    }
    if (value.length < minLength) {
      throw new AppError(`${fieldName} must be at least ${minLength} characters`, 400);
    }
    if (value.length > maxLength) {
      throw new AppError(`${fieldName} must be at most ${maxLength} characters`, 400);
    }
  }

  return value;
}

/**
 * Validate a required array field
 */
export function validateArray(value, fieldName, options = {}) {
  const { required = true, minLength = 0, itemType = null } = options;

  if (required && (!value || !Array.isArray(value) || value.length === 0)) {
    throw new AppError(`${fieldName} is required and must be a non-empty array`, 400);
  }

  if (value !== undefined && value !== null) {
    if (!Array.isArray(value)) {
      throw new AppError(`${fieldName} must be an array`, 400);
    }
    if (value.length < minLength) {
      throw new AppError(`${fieldName} must have at least ${minLength} items`, 400);
    }
    if (itemType) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== itemType) {
          throw new AppError(`${fieldName}[${i}] must be a ${itemType}`, 400);
        }
      }
    }
  }

  return value;
}

/**
 * Validate a boolean field
 */
export function validateBoolean(value, fieldName, options = {}) {
  const { required = false, defaultValue } = options;

  if (value === undefined || value === null) {
    if (required) {
      throw new AppError(`${fieldName} is required`, 400);
    }
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }

  return value;
}

/**
 * Validate an object field
 */
export function validateObject(value, fieldName, options = {}) {
  const { required = true } = options;

  if (required && (!value || typeof value !== 'object' || Array.isArray(value))) {
    throw new AppError(`${fieldName} is required and must be an object`, 400);
  }

  if (value !== undefined && value !== null) {
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new AppError(`${fieldName} must be an object`, 400);
    }
  }

  return value;
}

/**
 * Validate warehouse creation input
 */
export function validateWarehouseCreate(data) {
  const { name, platforms, fieldSelections, includeBlendedTable } = data;

  validateString(name, 'name', { required: false, maxLength: 100 });
  validateArray(platforms, 'platforms', { required: true, minLength: 1, itemType: 'string' });
  validateObject(fieldSelections, 'fieldSelections', { required: true });

  // Validate field selections for each platform
  for (const platformId of platforms) {
    if (!fieldSelections[platformId]) {
      throw new AppError(`Field selections missing for platform: ${platformId}`, 400);
    }

    const selection = fieldSelections[platformId];
    validateObject(selection, `fieldSelections.${platformId}`, { required: true });
    validateArray(selection.dimensions, `fieldSelections.${platformId}.dimensions`, {
      required: true,
      minLength: 1,
      itemType: 'string'
    });
    validateArray(selection.metrics, `fieldSelections.${platformId}.metrics`, {
      required: true,
      minLength: 1,
      itemType: 'string'
    });
  }

  return {
    name,
    platforms,
    fieldSelections,
    includeBlendedTable: validateBoolean(includeBlendedTable, 'includeBlendedTable', { defaultValue: true })
  };
}

/**
 * Validate warehouse update input
 */
export function validateWarehouseUpdate(data) {
  const validated = {};

  if (data.name !== undefined) {
    validated.name = validateString(data.name, 'name', { required: false, maxLength: 100 });
  }

  if (data.platforms !== undefined) {
    validated.platforms = validateArray(data.platforms, 'platforms', {
      required: false,
      minLength: 1,
      itemType: 'string'
    });
  }

  if (data.fieldSelections !== undefined) {
    validated.fieldSelections = validateObject(data.fieldSelections, 'fieldSelections', {
      required: false
    });
  }

  if (data.includeBlendedTable !== undefined) {
    validated.includeBlendedTable = validateBoolean(data.includeBlendedTable, 'includeBlendedTable');
  }

  return validated;
}
