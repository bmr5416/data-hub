/**
 * Request Timeout Middleware
 *
 * Enforces maximum request duration to prevent hung connections.
 * Returns 408 Request Timeout if exceeded.
 *
 * Features:
 * - Configurable timeout per route
 * - Proper cleanup on completion
 * - Distinguishes between timeout and other errors
 */

import { AppError } from '../errors/AppError.js';

/**
 * Default timeout in milliseconds (30 seconds)
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Extended timeout for heavy operations (2 minutes)
 */
export const EXTENDED_TIMEOUT = 120000;

/**
 * Create timeout middleware with specified duration
 * @param {number} ms - Timeout in milliseconds
 * @returns {Function} Express middleware
 */
export function timeout(ms = DEFAULT_TIMEOUT) {
  return (req, res, next) => {
    // Store original end for cleanup
    const originalEnd = res.end;
    let timedOut = false;
    let timeoutId = null;

    // Set up timeout handler
    timeoutId = setTimeout(() => {
      timedOut = true;

      // Create timeout error
      const error = new AppError(
        `Request timeout after ${ms / 1000} seconds`,
        408,
        'REQUEST_TIMEOUT'
      );
      error.isTimeout = true;

      // If headers not sent, pass error to handler
      if (!res.headersSent) {
        next(error);
      }
    }, ms);

    // Override end to clear timeout
    res.end = function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      // Only call original if not timed out
      if (!timedOut) {
        originalEnd.apply(res, args);
      }
    };

    // Also clear on response close/finish
    res.on('close', () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });

    res.on('finish', () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });

    // Add timeout check helper to request
    req.isTimedOut = () => timedOut;

    next();
  };
}

/**
 * Standard timeout middleware (30 seconds)
 * Suitable for most API endpoints
 */
export const standardTimeout = timeout(DEFAULT_TIMEOUT);

/**
 * Extended timeout middleware (2 minutes)
 * For resource-intensive operations like:
 * - PDF generation
 * - Large file uploads
 * - Report previews with complex data
 */
export const extendedTimeout = timeout(EXTENDED_TIMEOUT);

/**
 * No timeout middleware
 * For streaming endpoints or WebSocket upgrades
 * Use sparingly - prefer extended timeout
 */
export const noTimeout = (_req, _res, next) => next();
