/**
 * Warehouse Validation Schema
 */

import { PLATFORMS, isValidValue } from '../../constants/index.js';

/**
 * Validate warehouse creation data
 * @param {Object} data - Warehouse data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateWarehouseCreate(data) {
  const errors = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Warehouse name is required');
  } else if (data.name.length > 200) {
    errors.push('Warehouse name must be less than 200 characters');
  }

  // Platforms validation (optional)
  if (data.platforms) {
    if (!Array.isArray(data.platforms)) {
      errors.push('Platforms must be an array');
    } else {
      for (const platform of data.platforms) {
        if (!isValidValue(platform, PLATFORMS)) {
          errors.push(`Invalid platform: ${platform}`);
        }
      }
    }
  }

  // Field selections validation (optional)
  if (data.fieldSelections && typeof data.fieldSelections !== 'object') {
    errors.push('Field selections must be an object');
  }

  return errors;
}

/**
 * Validate warehouse update data
 * @param {Object} data - Warehouse update data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateWarehouseUpdate(data) {
  const errors = [];

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('Warehouse name cannot be empty');
    } else if (data.name.length > 200) {
      errors.push('Warehouse name must be less than 200 characters');
    }
  }

  // Platforms validation (if provided)
  if (data.platforms !== undefined) {
    if (!Array.isArray(data.platforms)) {
      errors.push('Platforms must be an array');
    } else {
      for (const platform of data.platforms) {
        if (!isValidValue(platform, PLATFORMS)) {
          errors.push(`Invalid platform: ${platform}`);
        }
      }
    }
  }

  // Field selections validation (if provided)
  if (data.fieldSelections !== undefined && data.fieldSelections !== null) {
    if (typeof data.fieldSelections !== 'object') {
      errors.push('Field selections must be an object');
    }
  }

  return errors;
}
