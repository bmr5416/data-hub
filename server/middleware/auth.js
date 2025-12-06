/**
 * JWT Authentication Middleware
 *
 * Verifies Supabase JWTs and attaches user info to req.user.
 *
 * Supports two verification modes:
 * - Production (ES256): Uses JWKS endpoint for asymmetric key verification
 * - Local Development (HS256): Uses SUPABASE_JWT_SECRET for symmetric verification
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Detect if we're using production Supabase (cloud) or local development
 * Production uses ES256 asymmetric keys via JWKS
 * Local uses HS256 with JWT secret
 */
function isProductionSupabase() {
  const url = process.env.SUPABASE_URL || '';
  return url.includes('.supabase.co');
}

/**
 * Cache for the JWKS (JSON Web Key Set) from Supabase
 * This avoids fetching the keys on every request
 */
let jwksCache = null;

/**
 * Get or create the JWKS remote key set for production verification
 * @returns {ReturnType<typeof createRemoteJWKSet>}
 */
function getJWKS() {
  if (!jwksCache) {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new AppError('SUPABASE_URL not configured', 500);
    }
    const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
    jwksCache = createRemoteJWKSet(jwksUrl);
    logger.info('JWKS endpoint configured', {
      url: jwksUrl.toString(),
      component: 'Auth'
    });
  }
  return jwksCache;
}

/**
 * Extract JWT token from Authorization header
 * @param {import('express').Request} req - Express request
 * @returns {string|null} JWT token or null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Verify JWT using ES256 (asymmetric) via JWKS endpoint
 * Used for production Supabase (cloud)
 * @param {string} token - JWT token
 * @returns {Promise<object>} Decoded token payload
 */
async function verifyJwtES256(token) {
  try {
    const jwks = getJWKS();
    const { payload } = await jwtVerify(token, jwks, {
      // Supabase Auth issues tokens with these issuers
      issuer: (iss) => iss?.includes('/auth/v1') ?? false,
    });
    return payload;
  } catch (error) {
    logger.debug('ES256 JWT verification failed', {
      error: error.message,
      code: error.code,
      component: 'Auth'
    });

    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new AppError('Token expired', 401);
    }
    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      throw new AppError('Invalid token signature', 401);
    }
    if (error.code === 'ERR_JWKS_NO_MATCHING_KEY') {
      throw new AppError('Token signed with unknown key', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
}

/**
 * Verify JWT using HS256 (symmetric) with JWT secret
 * Used for local development with Supabase CLI
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
function verifyJwtHS256(token) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    logger.error('SUPABASE_JWT_SECRET not configured for local development', {
      component: 'Auth'
    });
    throw new AppError('Server authentication not configured', 500);
  }

  // Debug: Log secret length and first/last chars (safe for debugging)
  logger.debug('HS256 verification attempt', {
    secretLength: secret.length,
    secretPrefix: secret.substring(0, 4),
    secretSuffix: secret.substring(secret.length - 4),
    component: 'Auth'
  });

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });
    return decoded;
  } catch (error) {
    // Debug: Log the actual error from jsonwebtoken
    logger.error('HS256 JWT verification failed', {
      errorName: error.name,
      errorMessage: error.message,
      component: 'Auth'
    });

    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
}

/**
 * Parse JWT header to detect signing algorithm
 * @param {string} token - JWT token
 * @returns {object} Decoded header
 */
function parseJwtHeader(token) {
  try {
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    return header;
  } catch {
    return { alg: 'unknown' };
  }
}

/**
 * Verify Supabase JWT - automatically selects verification method based on token algorithm
 * @param {string} token - JWT token
 * @returns {Promise<object>} Decoded token payload
 */
async function verifyJwt(token) {
  const header = parseJwtHeader(token);

  logger.debug('JWT verification starting', {
    algorithm: header.alg,
    kid: header.kid,
    isProduction: isProductionSupabase(),
    component: 'Auth'
  });

  // HS256 tokens require JWT secret (common for Supabase Cloud default config)
  if (header.alg === 'HS256') {
    return verifyJwtHS256(token);
  }

  // ES256 tokens can use JWKS endpoint
  if (header.alg === 'ES256') {
    return verifyJwtES256(token);
  }

  // Fallback based on environment
  if (isProductionSupabase()) {
    // Try ES256 first, fall back to HS256
    try {
      return await verifyJwtES256(token);
    } catch (error) {
      logger.debug('ES256 failed, trying HS256', { error: error.message, component: 'Auth' });
      return verifyJwtHS256(token);
    }
  }
  return verifyJwtHS256(token);
}

/**
 * Extract user info from decoded JWT payload
 * @param {object} decoded - Decoded JWT payload
 * @returns {object} User info object
 */
function extractUserFromPayload(decoded) {
  return {
    id: decoded.sub, // Supabase user UUID
    email: decoded.email,
    role: decoded.role || 'authenticated',
    isAdmin: decoded.user_metadata?.is_admin || false,
    metadata: decoded.user_metadata || {},
    appMetadata: decoded.app_metadata || {},
    aud: decoded.aud,
    exp: decoded.exp,
  };
}

/**
 * JWT authentication middleware
 * Verifies Supabase JWT and attaches user info to req.user
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('No authorization token provided', 401);
    }

    const decoded = await verifyJwt(token);

    // Store raw token for user-context Supabase queries
    req.token = token;

    // Attach user info to request
    req.user = extractUserFromPayload(decoded);

    // Debug log successful auth
    logger.debug('User authenticated', {
      userId: req.user.id,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      requestId: req.id,
      component: 'Auth',
    });

    next();
  } catch (error) {
    // If it's already an AppError, pass it through
    if (error instanceof AppError) {
      return next(error);
    }
    // Otherwise wrap it
    return next(new AppError(error.message || 'Authentication failed', 401));
  }
}

/**
 * Admin-only middleware
 * Must be used after requireAuth middleware
 *
 * Checks if the authenticated user has admin privileges.
 * Admin status is determined by user_metadata.is_admin in Supabase.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.user.isAdmin) {
    logger.warn('Admin access denied', {
      userId: req.user.id,
      email: req.user.email,
      requestId: req.id,
      component: 'Auth',
    });
    return next(new AppError('Admin access required', 403));
  }

  next();
}

/**
 * Optional auth middleware
 * Attaches user to request if valid token present, but doesn't require it.
 * Useful for endpoints that behave differently for authenticated vs anonymous users.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = await verifyJwt(token);
      req.token = token; // Store for user-context queries
      req.user = extractUserFromPayload(decoded);
    }

    next();
  } catch (error) {
    // Token invalid but auth is optional - continue without user
    logger.debug('Optional auth failed, continuing as anonymous', {
      error: error.message,
      requestId: req.id,
      component: 'Auth',
    });
    next();
  }
}
