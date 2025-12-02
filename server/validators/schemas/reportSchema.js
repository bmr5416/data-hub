/**
 * Report Validation Schema
 */

import {
  EMAIL_REGEX,
  REPORT_TYPES,
  REPORT_TOOLS,
  REPORT_FREQUENCIES,
  DELIVERY_FORMATS,
  isValidValue,
} from '../../constants/index.js';

/**
 * Validate report creation data
 * @param {Object} data - Report data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateReportCreate(data) {
  const errors = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Report name is required');
  } else if (data.name.length > 200) {
    errors.push('Report name must be less than 200 characters');
  }

  // Type validation (optional, has default)
  if (data.type && !isValidValue(data.type, REPORT_TYPES)) {
    errors.push(`Type must be one of: ${REPORT_TYPES.join(', ')}`);
  }

  // Tool validation (optional, has default)
  if (data.tool && !isValidValue(data.tool, REPORT_TOOLS)) {
    errors.push(`Tool must be one of: ${REPORT_TOOLS.join(', ')}`);
  }

  // Frequency validation (optional, has default)
  if (data.frequency && !isValidValue(data.frequency, REPORT_FREQUENCIES)) {
    errors.push(`Frequency must be one of: ${REPORT_FREQUENCIES.join(', ')}`);
  }

  // Delivery format validation (optional)
  if (data.format && !isValidValue(data.format, DELIVERY_FORMATS)) {
    errors.push(`Format must be one of: ${DELIVERY_FORMATS.join(', ')}`);
  }

  // Recipients validation (optional)
  if (data.recipients) {
    const recipients = Array.isArray(data.recipients) ? data.recipients : [data.recipients];
    for (const email of recipients) {
      if (email && !EMAIL_REGEX.test(email.trim())) {
        errors.push(`Invalid recipient email: ${email}`);
      }
    }
  }

  // URL validation (optional)
  if (data.url && data.url.length > 2000) {
    errors.push('URL must be less than 2000 characters');
  }

  return errors;
}

/**
 * Validate report update data
 * @param {Object} data - Report update data
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateReportUpdate(data) {
  const errors = [];

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('Report name cannot be empty');
    } else if (data.name.length > 200) {
      errors.push('Report name must be less than 200 characters');
    }
  }

  // Type validation (if provided)
  if (data.type !== undefined && !isValidValue(data.type, REPORT_TYPES)) {
    errors.push(`Type must be one of: ${REPORT_TYPES.join(', ')}`);
  }

  // Tool validation (if provided)
  if (data.tool !== undefined && !isValidValue(data.tool, REPORT_TOOLS)) {
    errors.push(`Tool must be one of: ${REPORT_TOOLS.join(', ')}`);
  }

  // Frequency validation (if provided)
  if (data.frequency !== undefined && !isValidValue(data.frequency, REPORT_FREQUENCIES)) {
    errors.push(`Frequency must be one of: ${REPORT_FREQUENCIES.join(', ')}`);
  }

  // Delivery format validation (if provided)
  if (data.format !== undefined && !isValidValue(data.format, DELIVERY_FORMATS)) {
    errors.push(`Format must be one of: ${DELIVERY_FORMATS.join(', ')}`);
  }

  // Recipients validation (if provided)
  if (data.recipients !== undefined) {
    const recipients = Array.isArray(data.recipients) ? data.recipients : [data.recipients];
    for (const email of recipients) {
      if (email && !EMAIL_REGEX.test(email.trim())) {
        errors.push(`Invalid recipient email: ${email}`);
      }
    }
  }

  return errors;
}

/**
 * Validate schedule configuration
 * @param {Object} config - Schedule config
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateScheduleConfig(config) {
  const errors = [];

  if (!config) {
    return errors;
  }

  // Validate cron expression format (basic check)
  if (config.cronExpression && typeof config.cronExpression !== 'string') {
    errors.push('Cron expression must be a string');
  }

  // Validate timezone
  if (config.timezone && typeof config.timezone !== 'string') {
    errors.push('Timezone must be a string');
  }

  return errors;
}
