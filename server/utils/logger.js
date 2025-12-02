/* eslint-disable no-console */
/**
 * Centralized Logger Utility
 *
 * Provides structured logging with log levels and request context.
 * In production, could be extended to write to external services.
 *
 * Log Levels:
 * - error: Critical failures requiring attention
 * - warn: Potential issues that don't stop execution
 * - info: Important operational messages
 * - debug: Detailed debugging information (dev only)
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Format log message with timestamp and structured data
 */
function formatMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  // In production, return JSON for log aggregation tools
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }

  // In development, format for readability
  const contextStr = Object.keys(context).length > 0
    ? ` ${JSON.stringify(context)}`
    : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Check if we should log at this level
 */
function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

/**
 * Logger object with methods for each log level
 */
const logger = {
  /**
   * Log error messages
   * @param {string} message - Error message
   * @param {Object} context - Additional context (error, requestId, etc.)
   */
  error(message, context = {}) {
    if (shouldLog('error')) {
      const output = formatMessage('error', message, context);
      console.error(output);
    }
  },

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    if (shouldLog('warn')) {
      const output = formatMessage('warn', message, context);
      console.warn(output);
    }
  },

  /**
   * Log informational messages
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    if (shouldLog('info')) {
      const output = formatMessage('info', message, context);
      console.log(output);
    }
  },

  /**
   * Log debug messages (development only by default)
   * @param {string} message - Debug message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    if (shouldLog('debug')) {
      const output = formatMessage('debug', message, context);
      console.log(output);
    }
  },

  /**
   * Create a child logger with preset context
   * Useful for adding requestId to all logs in a request
   * @param {Object} defaultContext - Context to include in all logs
   */
  child(defaultContext) {
    return {
      error: (message, context = {}) =>
        logger.error(message, { ...defaultContext, ...context }),
      warn: (message, context = {}) =>
        logger.warn(message, { ...defaultContext, ...context }),
      info: (message, context = {}) =>
        logger.info(message, { ...defaultContext, ...context }),
      debug: (message, context = {}) =>
        logger.debug(message, { ...defaultContext, ...context }),
    };
  },
};

export default logger;
