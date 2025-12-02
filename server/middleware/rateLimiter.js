/**
 * Rate Limiting Middleware
 */

import rateLimit from 'express-rate-limit';
import { AppError } from '../errors/AppError.js';

const ONE_MINUTE = 60 * 1000;
const TEN_MINUTES = 10 * ONE_MINUTE;
const FIFTEEN_MINUTES = 15 * ONE_MINUTE;
const ONE_HOUR = 60 * ONE_MINUTE;

// Development mode has much higher limits
const isDev = process.env.NODE_ENV !== 'production';

const rateLimitHandler = (_req, _res, next, options) => {
  const error = AppError.tooManyRequests(
    `Rate limit exceeded. Try again in ${Math.ceil(options.windowMs / 1000 / 60)} minutes.`
  );
  error.retryAfter = Math.ceil(options.windowMs / 1000);
  next(error);
};

const skipHealthChecks = (req) => {
  return req.path === '/api/health' || req.path.startsWith('/assets');
};

export const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: isDev ? 1000 : 100, // 1000/15min in dev, 100/15min in prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealthChecks,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
});

export const heavyLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
});

export const authLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
});

export const uploadLimiter = rateLimit({
  windowMs: TEN_MINUTES,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { xForwardedForHeader: false },
});

export function createRateLimiter({ windowMs, max, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: rateLimitHandler,
    validate: { xForwardedForHeader: false },
  });
}
