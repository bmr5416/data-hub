/**
 * Parameter Validation Middleware
 *
 * Provides Express middleware for validating route parameters.
 * Uses validators from services/validators.js
 */

import { validateUUID, validateEntityId } from '../services/validators.js';

/**
 * Middleware to validate a UUID route parameter
 * @param {string} paramName - The name of the parameter to validate
 * @returns {Function} Express middleware
 */
export function validateUUIDParam(paramName) {
  return (req, _res, next) => {
    try {
      req.params[paramName] = validateUUID(req.params[paramName], paramName);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate an entity ID route parameter (supports both UUID and prefixed formats)
 * @param {string} paramName - The name of the parameter to validate
 * @returns {Function} Express middleware
 */
export function validateEntityIdParam(paramName) {
  return (req, _res, next) => {
    try {
      req.params[paramName] = validateEntityId(req.params[paramName], paramName);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate multiple parameters at once
 * @param {Object} params - Object mapping param names to validator type ('uuid' | 'entityId')
 * @returns {Function} Express middleware
 */
export function validateParams(params) {
  return (req, _res, next) => {
    try {
      for (const [paramName, validatorType] of Object.entries(params)) {
        if (validatorType === 'uuid') {
          req.params[paramName] = validateUUID(req.params[paramName], paramName);
        } else if (validatorType === 'entityId') {
          req.params[paramName] = validateEntityId(req.params[paramName], paramName);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
