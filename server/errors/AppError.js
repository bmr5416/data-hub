/**
 * Enhanced Application Error Class
 *
 * Provides structured error handling with:
 * - HTTP status codes
 * - Machine-readable error codes
 * - Operational vs programmer error distinction
 * - Static factory methods for common error types
 */
export class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string|null} code - Machine-readable error code (optional)
   */
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguishes from programmer errors
    Error.captureStackTrace(this, this.constructor);
  }

  // ========== STATIC FACTORY METHODS ==========

  /**
   * 400 Bad Request - Invalid input or validation failure
   * @param {string} message - Error description
   * @returns {AppError}
   */
  static badRequest(message) {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  /**
   * 400 Bad Request - Validation errors with field details
   * @param {string[]} errors - Array of validation error messages
   * @returns {AppError}
   */
  static validationError(errors) {
    const message = Array.isArray(errors) ? errors.join(', ') : errors;
    return new AppError(message, 400, 'VALIDATION_ERROR');
  }

  /**
   * 401 Unauthorized - Authentication required
   * @param {string} message - Error description
   * @returns {AppError}
   */
  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  /**
   * 403 Forbidden - Access denied
   * @param {string} message - Error description
   * @returns {AppError}
   */
  static forbidden(message = 'Access denied') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  /**
   * 404 Not Found - Resource does not exist
   * @param {string} resource - Name of the resource type
   * @param {string} id - Resource identifier (optional)
   * @returns {AppError}
   */
  static notFound(resource, id = null) {
    const message = id ? `${resource} '${id}' not found` : `${resource} not found`;
    return new AppError(message, 404, 'NOT_FOUND');
  }

  /**
   * 409 Conflict - Resource already exists
   * @param {string} resource - Name of the resource type
   * @param {string} identifier - Conflicting identifier
   * @returns {AppError}
   */
  static conflict(resource, identifier) {
    return new AppError(`${resource} '${identifier}' already exists`, 409, 'CONFLICT');
  }

  /**
   * 422 Unprocessable Entity - Business logic violation
   * @param {string} message - Error description
   * @returns {AppError}
   */
  static unprocessable(message) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY');
  }

  /**
   * 429 Too Many Requests - Rate limit exceeded
   * @param {string} message - Error description
   * @returns {AppError}
   */
  static tooManyRequests(message = 'Rate limit exceeded') {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS');
  }

  /**
   * 500 Internal Server Error - Unexpected server error
   * @param {string} message - Error description
   * @returns {AppError}
   */
  static internal(message = 'An unexpected error occurred') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }

  /**
   * 503 Service Unavailable - External service failure
   * @param {string} service - Name of the unavailable service
   * @returns {AppError}
   */
  static serviceUnavailable(service) {
    return new AppError(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}
