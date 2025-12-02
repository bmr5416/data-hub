/**
 * Input Sanitization Middleware
 *
 * Protects against XSS attacks by sanitizing all string inputs.
 * Uses the `xss` library for comprehensive HTML sanitization.
 *
 * Features:
 * - Recursive object/array sanitization
 * - Configurable whitelist options
 * - Preserves non-string values
 * - Trims whitespace from strings
 */

import xss from 'xss';

/**
 * Default XSS filter options
 * Strips all HTML tags and attributes
 */
const DEFAULT_XSS_OPTIONS = {
  whiteList: {}, // No allowed tags
  stripIgnoreTag: true, // Strip tags not in whitelist
  stripIgnoreTagBody: ['script', 'style'], // Remove content of these tags
};

/**
 * Less strict options for fields that may contain safe HTML
 * (e.g., markdown-rendered content)
 */
const RELAXED_XSS_OPTIONS = {
  whiteList: {
    a: ['href', 'title', 'target'],
    b: [],
    i: [],
    em: [],
    strong: [],
    p: [],
    br: [],
    ul: [],
    ol: [],
    li: [],
    code: [],
    pre: [],
    blockquote: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
};

/**
 * Sanitize a single value
 * @param {*} value - Value to sanitize
 * @param {Object} options - XSS options
 * @returns {*} Sanitized value
 */
function sanitizeValue(value, options) {
  if (typeof value === 'string') {
    // Trim and sanitize strings
    const trimmed = value.trim();
    return xss(trimmed, options);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, options));
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value, options);
  }
  // Return non-string primitives as-is
  return value;
}

/**
 * Recursively sanitize all string values in an object
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - XSS options
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj, options) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, options);
  }
  return sanitized;
}

/**
 * Create sanitization middleware with custom options
 * @param {Object} options - XSS options or configuration
 * @param {Object} [options.xss] - XSS library options
 * @param {string[]} [options.skipFields] - Field names to skip sanitization
 * @returns {Function} Express middleware
 */
export function createSanitizer(options = {}) {
  const xssOptions = options.xss || DEFAULT_XSS_OPTIONS;
  const skipFields = new Set(options.skipFields || []);

  return (req, _res, next) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (!skipFields.has(key)) {
          req.body[key] = sanitizeValue(value, xssOptions);
        }
      }
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (!skipFields.has(key) && typeof value === 'string') {
          req.query[key] = sanitizeValue(value, xssOptions);
        }
      }
    }

    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
      for (const [key, value] of Object.entries(req.params)) {
        if (!skipFields.has(key) && typeof value === 'string') {
          req.params[key] = sanitizeValue(value, xssOptions);
        }
      }
    }

    next();
  };
}

/**
 * Standard sanitization middleware
 * Strips all HTML from inputs
 */
export const sanitize = createSanitizer();

/**
 * Relaxed sanitization middleware
 * Allows basic formatting HTML
 * Use for content fields that may contain safe markdown-rendered HTML
 */
export const sanitizeRelaxed = createSanitizer({ xss: RELAXED_XSS_OPTIONS });

/**
 * Sanitize a single string value (utility function)
 * @param {string} str - String to sanitize
 * @param {boolean} relaxed - Use relaxed options
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, relaxed = false) {
  if (typeof str !== 'string') {
    return str;
  }
  const options = relaxed ? RELAXED_XSS_OPTIONS : DEFAULT_XSS_OPTIONS;
  return xss(str.trim(), options);
}

/**
 * Sanitize request body only (for routes that handle params separately)
 */
export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body, DEFAULT_XSS_OPTIONS);
  }
  next();
}

/**
 * Fields containing sensitive data - exported for use in logging/redaction
 * These fields should be masked in logs and error messages
 * @see server/utils/logger.js for redaction implementation
 */
export const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'api_key',
  'apiKey',
  'secret',
  'credentials',
  'authorization',
]);

/**
 * Check if a value might contain malicious content
 * Returns true if suspicious patterns detected
 * @param {string} value - Value to check
 * @returns {boolean} True if suspicious
 */
export function isSuspicious(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(value));
}
