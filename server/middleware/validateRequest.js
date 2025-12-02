/**
 * Request Validation Middleware
 *
 * Provides Express middleware factories for validating request
 * body, params, and query parameters.
 *
 * Uses schema functions that return arrays of error messages.
 */

import { AppError } from '../errors/AppError.js';
import { validateEntityId, validateUUID } from '../services/validators.js';

/**
 * Validate request body using a schema function
 *
 * Schema function should return an array of error messages (empty = valid).
 *
 * @param {function(object): string[]} schema - Validation function
 * @returns {import('express').RequestHandler} Express middleware
 *
 * @example
 * import { validateClientCreate } from '../validators/schemas/clientSchema.js';
 * router.post('/', validateBody(validateClientCreate), handler);
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const errors = schema(req.body);

      if (errors && errors.length > 0) {
        return next(AppError.validationError(errors));
      }

      next();
    } catch (error) {
      // If schema throws directly (e.g., using throw new AppError)
      return next(error);
    }
  };
}

/**
 * Validate route parameters
 *
 * @param {Object.<string, function>} validators - Map of param name to validator function
 * @returns {import('express').RequestHandler} Express middleware
 *
 * @example
 * router.get('/:clientId', validateParams({ clientId: validateEntityId }), handler);
 */
export function validateParams(validators) {
  return (req, res, next) => {
    try {
      for (const [param, validator] of Object.entries(validators)) {
        const value = req.params[param];
        validator(value, param);
      }
      next();
    } catch (error) {
      return next(error);
    }
  };
}

/**
 * Validate query parameters
 *
 * @param {Object.<string, function>} validators - Map of query param name to validator function
 * @returns {import('express').RequestHandler} Express middleware
 *
 * @example
 * router.get('/', validateQuery({ status: validateStatus }), handler);
 */
export function validateQuery(validators) {
  return (req, res, next) => {
    try {
      for (const [param, validator] of Object.entries(validators)) {
        const value = req.query[param];
        // Query params are optional unless validator enforces otherwise
        if (value !== undefined) {
          validator(value, param);
        }
      }
      next();
    } catch (error) {
      return next(error);
    }
  };
}

// ========== PRE-BUILT PARAMETER VALIDATORS ==========

/**
 * Pre-configured middleware for common parameter validations
 */
export const params = {
  /**
   * Validate :clientId parameter
   */
  clientId: validateParams({ clientId: validateEntityId }),

  /**
   * Validate :id parameter as entity ID
   */
  id: validateParams({ id: validateEntityId }),

  /**
   * Validate :id parameter as UUID
   */
  uuid: validateParams({ id: validateUUID }),

  /**
   * Validate :warehouseId parameter
   */
  warehouseId: validateParams({ warehouseId: validateEntityId }),

  /**
   * Validate :reportId parameter
   */
  reportId: validateParams({ reportId: validateEntityId }),

  /**
   * Validate :sourceId parameter
   */
  sourceId: validateParams({ sourceId: validateEntityId }),

  /**
   * Validate :alertId parameter
   */
  alertId: validateParams({ alertId: validateEntityId }),

  /**
   * Validate :platformId parameter (string, not entity ID)
   */
  platformId: validateParams({
    platformId: (value, name) => {
      if (!value || typeof value !== 'string' || value.length === 0) {
        throw AppError.badRequest(`${name} is required`);
      }
      return value;
    },
  }),
};

// ========== VALIDATION HELPER FACTORIES ==========

/**
 * Create enum validator for query/body fields
 *
 * @param {string[]} allowedValues - Valid enum values
 * @param {boolean} required - Whether field is required
 * @returns {function} Validator function
 */
export function enumValidator(allowedValues, required = false) {
  return (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      if (required) {
        throw AppError.badRequest(`${fieldName} is required`);
      }
      return value;
    }

    if (!allowedValues.includes(value)) {
      throw AppError.badRequest(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }

    return value;
  };
}

/**
 * Create string validator with options
 *
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether field is required
 * @param {number} options.minLength - Minimum length
 * @param {number} options.maxLength - Maximum length
 * @param {RegExp} options.pattern - Regex pattern to match
 * @returns {function} Validator function
 */
export function stringValidator(options = {}) {
  const { required = false, minLength = 0, maxLength = 255, pattern = null } = options;

  return (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      if (required) {
        throw AppError.badRequest(`${fieldName} is required`);
      }
      return value;
    }

    if (typeof value !== 'string') {
      throw AppError.badRequest(`${fieldName} must be a string`);
    }

    if (value.length < minLength) {
      throw AppError.badRequest(`${fieldName} must be at least ${minLength} characters`);
    }

    if (value.length > maxLength) {
      throw AppError.badRequest(`${fieldName} must be at most ${maxLength} characters`);
    }

    if (pattern && !pattern.test(value)) {
      throw AppError.badRequest(`${fieldName} format is invalid`);
    }

    return value;
  };
}

/**
 * Create integer validator with range
 *
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether field is required
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @returns {function} Validator function
 */
export function integerValidator(options = {}) {
  const { required = false, min = null, max = null } = options;

  return (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      if (required) {
        throw AppError.badRequest(`${fieldName} is required`);
      }
      return value;
    }

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw AppError.badRequest(`${fieldName} must be an integer`);
    }

    if (min !== null && num < min) {
      throw AppError.badRequest(`${fieldName} must be at least ${min}`);
    }

    if (max !== null && num > max) {
      throw AppError.badRequest(`${fieldName} must be at most ${max}`);
    }

    return num;
  };
}

/**
 * Create email validator
 *
 * @param {boolean} required - Whether field is required
 * @returns {function} Validator function
 */
export function emailValidator(required = true) {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      if (required) {
        throw AppError.badRequest(`${fieldName} is required`);
      }
      return value;
    }

    if (typeof value !== 'string') {
      throw AppError.badRequest(`${fieldName} must be a string`);
    }

    if (!EMAIL_REGEX.test(value)) {
      throw AppError.badRequest(`${fieldName} must be a valid email address`);
    }

    return value.toLowerCase().trim();
  };
}
