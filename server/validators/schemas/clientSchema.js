/**
 * Client Validation Schema
 */

import { EMAIL_REGEX, CLIENT_STATUSES, INDUSTRIES, isValidValue } from '../../constants/index.js';

/**
 * Validate client creation data
 * @param {Object} data - Client data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateClientCreate(data) {
  const errors = [];
  const name = data.name?.trim();
  const email = data.email?.trim();

  // Name validation
  if (!name) {
    errors.push('Client name is required');
  } else if (name.length < 2) {
    errors.push('Client name must be at least 2 characters');
  } else if (name.length > 100) {
    errors.push('Client name must be less than 100 characters');
  }

  // Email validation
  if (!email) {
    errors.push('Client email is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Invalid email format');
  }

  // Status validation (optional, has default)
  if (data.status && !isValidValue(data.status, CLIENT_STATUSES)) {
    errors.push(`Status must be one of: ${CLIENT_STATUSES.join(', ')}`);
  }

  // Industry validation (optional)
  if (data.industry && !isValidValue(data.industry, INDUSTRIES)) {
    errors.push(`Industry must be one of: ${INDUSTRIES.join(', ')}`);
  }

  return errors;
}

/**
 * Validate client update data
 * @param {Object} data - Client update data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateClientUpdate(data) {
  const errors = [];

  // Name validation (if provided)
  if (data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) {
      errors.push('Client name cannot be empty');
    } else if (name.length < 2) {
      errors.push('Client name must be at least 2 characters');
    } else if (name.length > 100) {
      errors.push('Client name must be less than 100 characters');
    }
  }

  // Email validation (if provided)
  if (data.email !== undefined) {
    const email = data.email?.trim();
    if (!email) {
      errors.push('Client email cannot be empty');
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push('Invalid email format');
    }
  }

  // Status validation (if provided)
  if (data.status !== undefined && !isValidValue(data.status, CLIENT_STATUSES)) {
    errors.push(`Status must be one of: ${CLIENT_STATUSES.join(', ')}`);
  }

  // Industry validation (if provided)
  if (data.industry !== undefined && data.industry && !isValidValue(data.industry, INDUSTRIES)) {
    errors.push(`Industry must be one of: ${INDUSTRIES.join(', ')}`);
  }

  return errors;
}
