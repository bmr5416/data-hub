/**
 * JWT Authentication Middleware
 *
 * Verifies Supabase JWTs and attaches user info to req.user.
 * Uses the SUPABASE_JWT_SECRET for HS256 verification.
 */

import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import logger from '../utils/logger.js';

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
 * Verify Supabase JWT using the JWT secret
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 * @throws {AppError} If verification fails
 */
function verifyJwt(token) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    logger.error('SUPABASE_JWT_SECRET not configured', { component: 'Auth' });
    throw new AppError('Server authentication not configured', 500);
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });
    return decoded;
  } catch (error) {
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
 * JWT authentication middleware
 * Verifies Supabase JWT and attaches user info to req.user
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('No authorization token provided', 401);
    }

    const decoded = verifyJwt(token);

    // Store raw token for user-context Supabase queries
    req.token = token;

    // Attach user info to request
    // Supabase JWT claims: sub (user id), email, role, user_metadata, app_metadata
    req.user = {
      id: decoded.sub, // Supabase user UUID
      email: decoded.email,
      role: decoded.role || 'authenticated',
      isAdmin: decoded.user_metadata?.is_admin || false,
      metadata: decoded.user_metadata || {},
      appMetadata: decoded.app_metadata || {},
      aud: decoded.aud,
      exp: decoded.exp,
    };

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
export function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyJwt(token);
      req.token = token; // Store for user-context queries
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'authenticated',
        isAdmin: decoded.user_metadata?.is_admin || false,
        metadata: decoded.user_metadata || {},
        appMetadata: decoded.app_metadata || {},
      };
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
