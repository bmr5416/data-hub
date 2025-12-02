/**
 * Retry Helper with Exponential Backoff
 *
 * Provides retry logic for transient failures with configurable
 * exponential backoff and jitter.
 */

import logger from '../utils/logger.js';

const log = logger.child({ component: 'RetryHelper' });

/**
 * Retryable Supabase/PostgreSQL error codes
 */
const RETRYABLE_ERROR_CODES = new Set([
  // Connection errors
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
  // Lock/serialization errors
  '40001', // serialization_failure
  '40P01', // deadlock_detected
  '55P03', // lock_not_available
  // Resource errors
  '53100', // disk_full
  '53200', // out_of_memory
  '53300', // too_many_connections
  '54000', // program_limit_exceeded
  // Supabase specific
  'PGRST000', // Generic PostgREST error
]);

/**
 * HTTP status codes that indicate retryable errors
 */
const RETRYABLE_HTTP_STATUSES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * Check if an error is retryable
 *
 * @param {Error} error - Error to check
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  // Check for network errors
  if (error.name === 'FetchError' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Check for retryable PostgreSQL error codes
  if (error.code && RETRYABLE_ERROR_CODES.has(error.code)) {
    return true;
  }

  // Check for retryable HTTP status codes
  if (error.status && RETRYABLE_HTTP_STATUSES.has(error.status)) {
    return true;
  }

  // Check error message for common transient patterns
  const message = error.message?.toLowerCase() || '';
  if (
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('network') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('temporarily unavailable') ||
    message.includes('service unavailable')
  ) {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds with optional jitter
 *
 * @param {number} ms - Base milliseconds to sleep
 * @param {boolean} addJitter - Whether to add random jitter (±25%)
 * @returns {Promise<void>}
 */
function sleep(ms, addJitter = true) {
  const jitter = addJitter ? ms * (0.5 + Math.random()) : ms;
  return new Promise((resolve) => setTimeout(resolve, jitter));
}

/**
 * Execute operation with retry logic and exponential backoff
 *
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 100)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {string} options.operationName - Name for logging (default: 'operation')
 * @param {Function} options.shouldRetry - Custom retry condition function
 * @returns {Promise<*>} Result of the operation
 */
export async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 10000,
    operationName = 'operation',
    shouldRetry = isRetryableError,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or error is not retryable
      if (attempt >= maxRetries || !shouldRetry(error)) {
        log.error(`${operationName} failed after ${attempt + 1} attempts`, {
          attempt: attempt + 1,
          maxRetries,
          error: error.message,
          code: error.code,
          retryable: false,
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      log.warn(`${operationName} failed, retrying...`, {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        error: error.message,
        code: error.code,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Wrap a function to automatically retry on transient failures
 *
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Retry options (same as withRetry)
 * @returns {Function} Wrapped function with retry logic
 */
export function withRetryWrapper(fn, options = {}) {
  return async (...args) => {
    return withRetry(() => fn(...args), options);
  };
}

/**
 * Execute multiple operations in parallel with individual retry logic
 *
 * @param {Array<Function>} operations - Array of async functions
 * @param {Object} options - Retry options
 * @returns {Promise<Array>} Array of results (or errors wrapped as { error })
 */
export async function withRetryAll(operations, options = {}) {
  return Promise.all(
    operations.map(async (op, index) => {
      try {
        return await withRetry(op, {
          ...options,
          operationName: options.operationName ? `${options.operationName}[${index}]` : `operation[${index}]`,
        });
      } catch (error) {
        return { error };
      }
    })
  );
}

export default {
  withRetry,
  withRetryWrapper,
  withRetryAll,
  isRetryableError,
};
