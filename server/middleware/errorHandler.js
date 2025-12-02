import logger from '../utils/logger.js';

// Re-export AppError from new location for backwards compatibility
export { AppError } from '../errors/AppError.js';

/**
 * Supabase/PostgreSQL error code mapping
 * Translates database errors to user-friendly responses
 * Includes retryable flag for client-side retry logic
 */
const SUPABASE_ERROR_MAP = {
  // PostgREST errors
  PGRST116: { message: 'Resource not found', statusCode: 404, retryable: false },
  PGRST301: { message: 'Resource has been moved', statusCode: 301, retryable: false },
  PGRST204: { message: 'No content available', statusCode: 204, retryable: false },
  PGRST000: { message: 'PostgREST error', statusCode: 500, retryable: true },

  // PostgreSQL constraint errors
  '23505': { message: 'Resource already exists', statusCode: 409, retryable: false },
  '23503': { message: 'Referenced resource does not exist', statusCode: 400, retryable: false },
  '23502': { message: 'Required field is missing', statusCode: 400, retryable: false },
  '23514': { message: 'Value does not meet constraints', statusCode: 400, retryable: false },

  // PostgreSQL permission errors
  '42501': { message: 'Permission denied', statusCode: 403, retryable: false },
  '42P01': { message: 'Resource type does not exist', statusCode: 500, retryable: false },

  // PostgreSQL connection errors (retryable)
  '08000': { message: 'Database connection failed', statusCode: 503, retryable: true },
  '08001': { message: 'Unable to establish connection', statusCode: 503, retryable: true },
  '08003': { message: 'Database connection lost', statusCode: 503, retryable: true },
  '08004': { message: 'Connection rejected', statusCode: 503, retryable: true },
  '08006': { message: 'Database connection failed', statusCode: 503, retryable: true },

  // PostgreSQL transaction/lock errors (retryable)
  '40001': { message: 'Transaction conflict, please retry', statusCode: 409, retryable: true },
  '40P01': { message: 'Transaction deadlock detected', statusCode: 503, retryable: true },
  '55P03': { message: 'Lock not available, please retry', statusCode: 503, retryable: true },

  // PostgreSQL resource errors (retryable)
  '53100': { message: 'Disk full', statusCode: 503, retryable: true },
  '53200': { message: 'Out of memory', statusCode: 503, retryable: true },
  '53300': { message: 'Too many connections', statusCode: 503, retryable: true },
  '54000': { message: 'Database overloaded', statusCode: 503, retryable: true },

  // Application-level errors
  RATE_LIMIT: { message: 'Rate limit exceeded, please try again later', statusCode: 429, retryable: true },
  AUTH_REQUIRED: { message: 'Authentication required', statusCode: 401, retryable: false },
  FORBIDDEN: { message: 'Access denied', statusCode: 403, retryable: false },
  NOT_FOUND: { message: 'Resource not found', statusCode: 404, retryable: false },
  VALIDATION_ERROR: { message: 'Invalid request data', statusCode: 400, retryable: false },
};

/**
 * Translate Supabase/PostgreSQL errors to user-friendly format
 * @param {Error} err - The error object
 * @returns {{ message: string, statusCode: number } | null}
 */
function translateSupabaseError(err) {
  // Check for Supabase error code
  if (err.code && SUPABASE_ERROR_MAP[err.code]) {
    return SUPABASE_ERROR_MAP[err.code];
  }

  // Check for PostgreSQL error in message
  if (err.message) {
    // Handle foreign key violation details
    if (err.message.includes('violates foreign key constraint')) {
      return { message: 'Referenced resource does not exist', statusCode: 400 };
    }
    // Handle unique constraint violation details
    if (err.message.includes('duplicate key value violates unique constraint')) {
      return { message: 'Resource already exists', statusCode: 409 };
    }
    // Handle not null violation
    if (err.message.includes('violates not-null constraint')) {
      return { message: 'Required field is missing', statusCode: 400 };
    }
  }

  return null;
}

/**
 * Determine if an error is retryable
 * @param {Error} err - The error object
 * @param {Object|null} translatedError - Translated error info
 * @param {number} statusCode - HTTP status code
 * @returns {boolean}
 */
function isRetryableError(err, translatedError, statusCode) {
  // Check if error or translated error explicitly specifies retryable
  if (err.retryable !== undefined) return err.retryable;
  if (translatedError?.retryable !== undefined) return translatedError.retryable;

  // Default: 5xx errors and 429 are retryable
  return statusCode >= 500 || statusCode === 429;
}

/**
 * Express error handling middleware
 * Handles all errors and returns consistent JSON responses
 * Includes retryable flag for client-side retry logic
 */
export function errorHandler(err, req, res, _next) {
  // Attempt to translate Supabase/PostgreSQL errors
  const translatedError = translateSupabaseError(err);

  // Determine status code
  let statusCode = err.statusCode || translatedError?.statusCode || 500;

  // Determine message - hide internal errors in production
  let message;
  if (err.isOperational) {
    // Operational errors are safe to expose
    message = err.message;
  } else if (translatedError) {
    // Translated database errors use friendly messages
    message = translatedError.message;
  } else if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    // Hide internal error details in production
    message = 'An unexpected error occurred';
  } else {
    message = err.message || 'Internal server error';
  }

  // Determine if error is retryable
  const retryable = isRetryableError(err, translatedError, statusCode);

  // Structured error logging with request context
  const errorContext = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode: err.code || null,
    retryable,
    originalMessage: err.message, // Always log original message for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Use appropriate log level based on status code
  if (statusCode >= 500) {
    logger.error(message, errorContext);
  } else if (statusCode >= 400) {
    logger.warn(message, errorContext);
  } else {
    logger.info(message, errorContext);
  }

  // Send JSON response with retryable flag
  res.status(statusCode).json({
    error: {
      message,
      code: err.code || null,
      requestId: req.id,
      retryable,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
