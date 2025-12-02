import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';

/**
 * Middleware to generate and attach request IDs for request tracing.
 * The request ID is attached to:
 * - req.id - for use in downstream middleware/routes
 * - res.setHeader('X-Request-ID', id) - for client correlation
 */
export function requestIdMiddleware(req, res, next) {
  // Use existing request ID from header or generate new one
  const requestId = req.headers['x-request-id'] || randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}

/**
 * Create a request-scoped logger with request ID context
 * Uses the centralized logger's child() method for consistency
 */
export function getRequestLogger(req) {
  return logger.child({
    requestId: req.id,
    method: req.method,
    path: req.path,
  });
}

/**
 * Request logging middleware (logs incoming requests and responses)
 */
export function requestLoggingMiddleware(req, res, next) {
  const startTime = Date.now();
  const logger = getRequestLogger(req);

  // Log incoming request
  logger.info('Request received', {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.headers['user-agent'],
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('Request completed', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
