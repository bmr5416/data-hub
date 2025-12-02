/**
 * KPI Validation Schema
 */

import { KPI_CATEGORIES, KPI_FREQUENCIES, isValidValue } from '../../constants/index.js';

/**
 * Validate KPI creation data
 * @param {Object} data - KPI data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateKPICreate(data) {
  const errors = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('KPI name is required');
  } else if (data.name.length > 200) {
    errors.push('KPI name must be less than 200 characters');
  }

  // Category validation (optional, has default)
  if (data.category && !isValidValue(data.category, KPI_CATEGORIES)) {
    errors.push(`Category must be one of: ${KPI_CATEGORIES.join(', ')}`);
  }

  // Reporting frequency validation (optional, has default)
  if (data.reportingFrequency && !isValidValue(data.reportingFrequency, KPI_FREQUENCIES)) {
    errors.push(`Reporting frequency must be one of: ${KPI_FREQUENCIES.join(', ')}`);
  }

  // Target value validation (optional)
  if (data.targetValue !== undefined && data.targetValue !== null && data.targetValue !== '') {
    const numValue = parseFloat(data.targetValue);
    if (isNaN(numValue)) {
      errors.push('Target value must be a valid number');
    }
  }

  // Current value validation (optional)
  if (data.currentValue !== undefined && data.currentValue !== null && data.currentValue !== '') {
    const numValue = parseFloat(data.currentValue);
    if (isNaN(numValue)) {
      errors.push('Current value must be a valid number');
    }
  }

  return errors;
}

/**
 * Validate KPI update data
 * @param {Object} data - KPI update data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateKPIUpdate(data) {
  const errors = [];

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('KPI name cannot be empty');
    } else if (data.name.length > 200) {
      errors.push('KPI name must be less than 200 characters');
    }
  }

  // Category validation (if provided)
  if (data.category !== undefined && !isValidValue(data.category, KPI_CATEGORIES)) {
    errors.push(`Category must be one of: ${KPI_CATEGORIES.join(', ')}`);
  }

  // Reporting frequency validation (if provided)
  if (data.reportingFrequency !== undefined && !isValidValue(data.reportingFrequency, KPI_FREQUENCIES)) {
    errors.push(`Reporting frequency must be one of: ${KPI_FREQUENCIES.join(', ')}`);
  }

  // Target value validation (if provided)
  if (data.targetValue !== undefined && data.targetValue !== null && data.targetValue !== '') {
    const numValue = parseFloat(data.targetValue);
    if (isNaN(numValue)) {
      errors.push('Target value must be a valid number');
    }
  }

  // Current value validation (if provided)
  if (data.currentValue !== undefined && data.currentValue !== null && data.currentValue !== '') {
    const numValue = parseFloat(data.currentValue);
    if (isNaN(numValue)) {
      errors.push('Current value must be a valid number');
    }
  }

  return errors;
}
