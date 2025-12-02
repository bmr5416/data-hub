/**
 * Source Validation Schema
 */

import {
  PLATFORMS,
  SOURCE_STATUSES,
  SOURCE_TYPES,
  CONNECTION_METHODS,
  REFRESH_FREQUENCIES,
  isValidValue,
} from '../../constants/index.js';

/**
 * Validate source creation data
 * @param {Object} data - Source data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateSourceCreate(data) {
  const errors = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Source name is required');
  }

  // Platform validation
  if (!data.platform) {
    errors.push('Platform is required');
  } else if (!isValidValue(data.platform, PLATFORMS)) {
    errors.push(`Platform must be one of: ${PLATFORMS.join(', ')}`);
  }

  // Source type validation (optional, has default)
  if (data.sourceType && !isValidValue(data.sourceType, SOURCE_TYPES)) {
    errors.push(`Source type must be one of: ${SOURCE_TYPES.join(', ')}`);
  }

  // Connection method validation (optional, has default)
  if (data.connectionMethod && !isValidValue(data.connectionMethod, CONNECTION_METHODS)) {
    errors.push(`Connection method must be one of: ${CONNECTION_METHODS.join(', ')}`);
  }

  // Refresh frequency validation (optional, has default)
  if (data.refreshFrequency && !isValidValue(data.refreshFrequency, REFRESH_FREQUENCIES)) {
    errors.push(`Refresh frequency must be one of: ${REFRESH_FREQUENCIES.join(', ')}`);
  }

  // Status validation (optional, has default)
  if (data.status && !isValidValue(data.status, SOURCE_STATUSES)) {
    errors.push(`Status must be one of: ${SOURCE_STATUSES.join(', ')}`);
  }

  return errors;
}

/**
 * Validate source update data
 * @param {Object} data - Source update data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateSourceUpdate(data) {
  const errors = [];

  // Name validation (if provided)
  if (data.name !== undefined && !data.name?.trim()) {
    errors.push('Source name cannot be empty');
  }

  // Platform validation (if provided)
  if (data.platform !== undefined && !isValidValue(data.platform, PLATFORMS)) {
    errors.push(`Platform must be one of: ${PLATFORMS.join(', ')}`);
  }

  // Source type validation (if provided)
  if (data.sourceType !== undefined && !isValidValue(data.sourceType, SOURCE_TYPES)) {
    errors.push(`Source type must be one of: ${SOURCE_TYPES.join(', ')}`);
  }

  // Connection method validation (if provided)
  if (data.connectionMethod !== undefined && !isValidValue(data.connectionMethod, CONNECTION_METHODS)) {
    errors.push(`Connection method must be one of: ${CONNECTION_METHODS.join(', ')}`);
  }

  // Refresh frequency validation (if provided)
  if (data.refreshFrequency !== undefined && !isValidValue(data.refreshFrequency, REFRESH_FREQUENCIES)) {
    errors.push(`Refresh frequency must be one of: ${REFRESH_FREQUENCIES.join(', ')}`);
  }

  // Status validation (if provided)
  if (data.status !== undefined && !isValidValue(data.status, SOURCE_STATUSES)) {
    errors.push(`Status must be one of: ${SOURCE_STATUSES.join(', ')}`);
  }

  return errors;
}
