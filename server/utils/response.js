/**
 * Response Helpers
 *
 * Standardized response formatting utilities.
 */

/**
 * Send a successful JSON response
 * @param {Response} res - Express response object
 * @param {*} data - Response data
 * @param {number} status - HTTP status code (default: 200)
 */
export function success(res, data, status = 200) {
  res.status(status).json(data);
}

/**
 * Send a created response (201)
 * @param {Response} res - Express response object
 * @param {*} data - Created resource data
 */
export function created(res, data) {
  success(res, data, 201);
}

/**
 * Send a no content response (204)
 * @param {Response} res - Express response object
 */
export function noContent(res) {
  res.status(204).send();
}

/**
 * Send a paginated response with metadata
 * @param {Response} res - Express response object
 * @param {Object} options - Pagination options
 * @param {Array} options.data - Array of items
 * @param {number} options.total - Total count of items
 * @param {number} options.page - Current page number
 * @param {number} options.pageSize - Items per page
 * @param {string} [options.key] - Optional key name for the data array (default: 'data')
 */
export function paginated(res, { data, total, page, pageSize, key = 'data' }) {
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    [key]: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

/**
 * Send an error response (typically used in error handlers)
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 500)
 * @param {string} [code] - Optional error code
 */
export function error(res, message, status = 500, code = null) {
  const response = { error: message };
  if (code) {
    response.code = code;
  }
  res.status(status).json(response);
}

/**
 * Send a validation error response (400)
 * @param {Response} res - Express response object
 * @param {string|string[]} errors - Validation error(s)
 */
export function validationError(res, errors) {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  res.status(400).json({
    error: 'Validation failed',
    errors: errorArray,
  });
}

/**
 * Send a not found response (404)
 * @param {Response} res - Express response object
 * @param {string} resource - Resource type (e.g., 'Client')
 * @param {string} [id] - Optional resource ID
 */
export function notFound(res, resource, id = null) {
  const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
  error(res, message, 404, 'NOT_FOUND');
}

/**
 * Send a forbidden response (403)
 * @param {Response} res - Express response object
 * @param {string} [message] - Optional custom message
 */
export function forbidden(res, message = 'Access denied') {
  error(res, message, 403, 'FORBIDDEN');
}

/**
 * Send an unauthorized response (401)
 * @param {Response} res - Express response object
 * @param {string} [message] - Optional custom message
 */
export function unauthorized(res, message = 'Authentication required') {
  error(res, message, 401, 'UNAUTHORIZED');
}

/**
 * Send a conflict response (409)
 * @param {Response} res - Express response object
 * @param {string} message - Conflict message
 */
export function conflict(res, message) {
  error(res, message, 409, 'CONFLICT');
}
