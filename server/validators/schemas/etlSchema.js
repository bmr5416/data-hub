/**
 * ETL Process Validation Schema
 */

import { ETL_STATUSES, ORCHESTRATORS, isValidValue } from '../../constants/index.js';

/**
 * Validate ETL process creation data
 * @param {Object} data - ETL data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateETLCreate(data) {
  const errors = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('ETL process name is required');
  } else if (data.name.length > 200) {
    errors.push('ETL process name must be less than 200 characters');
  }

  // Orchestrator validation (optional, has default)
  if (data.orchestrator && !isValidValue(data.orchestrator, ORCHESTRATORS)) {
    errors.push(`Orchestrator must be one of: ${ORCHESTRATORS.join(', ')}`);
  }

  // Status validation (optional, has default)
  if (data.status && !isValidValue(data.status, ETL_STATUSES)) {
    errors.push(`Status must be one of: ${ETL_STATUSES.join(', ')}`);
  }

  return errors;
}

/**
 * Validate ETL process update data
 * @param {Object} data - ETL update data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateETLUpdate(data) {
  const errors = [];

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('ETL process name cannot be empty');
    } else if (data.name.length > 200) {
      errors.push('ETL process name must be less than 200 characters');
    }
  }

  // Orchestrator validation (if provided)
  if (data.orchestrator !== undefined && !isValidValue(data.orchestrator, ORCHESTRATORS)) {
    errors.push(`Orchestrator must be one of: ${ORCHESTRATORS.join(', ')}`);
  }

  // Status validation (if provided)
  if (data.status !== undefined && !isValidValue(data.status, ETL_STATUSES)) {
    errors.push(`Status must be one of: ${ETL_STATUSES.join(', ')}`);
  }

  return errors;
}
