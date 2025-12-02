/**
 * Auth Routes
 *
 * Provides authentication endpoints for Supabase Auth integration.
 * Note: Actual sign-in/sign-up is handled client-side via Supabase SDK.
 * These endpoints provide server-side user profile and session validation.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../services/supabaseClient.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * Rate limiter for auth endpoints
 * Prevents brute force attacks: 30 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per window
  message: { error: { message: 'Too many requests. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile with assigned clients
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    // Get user profile from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Failed to fetch user profile', {
        userId: req.user.id,
        error: profileError.message,
        component: 'Auth',
      });
      throw new AppError('Failed to fetch user profile', 500);
    }

    // Get user's client assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_client_assignments')
      .select(`
        client_id,
        role,
        assigned_at,
        clients (
          id,
          name,
          status
        )
      `)
      .eq('user_id', req.user.id);

    if (assignmentsError) {
      logger.error('Failed to fetch client assignments', {
        userId: req.user.id,
        error: assignmentsError.message,
        component: 'Auth',
      });
      // Don't fail - continue with empty assignments
    }

    // Update last login timestamp
    await supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', req.user.id);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: profile?.display_name || req.user.email.split('@')[0],
        avatarUrl: profile?.avatar_url,
        isAdmin: profile?.is_admin || req.user.isAdmin,
        isActive: profile?.is_active ?? true,
        createdAt: profile?.created_at,
        lastLoginAt: profile?.last_login_at,
        assignedClients: assignments?.map((a) => ({
          clientId: a.client_id,
          role: a.role,
          assignedAt: a.assigned_at,
          client: a.clients,
        })) || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/session
 * Validates current session and returns minimal user info
 * Useful for lightweight session checks
 */
router.get('/session', requireAuth, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
    },
    expiresAt: new Date(req.user.exp * 1000).toISOString(),
  });
});

/**
 * POST /api/auth/signout
 * Server-side session cleanup and audit logging
 * Note: Actual token invalidation happens client-side via Supabase
 */
router.post('/signout', requireAuth, async (req, res, next) => {
  try {
    logger.info('User signed out', {
      userId: req.user.id,
      email: req.user.email,
      requestId: req.id,
      component: 'Auth',
    });

    // Server-side signout is primarily for audit logging
    // The actual session invalidation happens client-side via Supabase SDK

    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/profile
 * Update current user's profile (display name, avatar)
 * Users cannot update their own admin status
 */
router.put('/profile', requireAuth, authLimiter, async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const { displayName, avatarUrl } = req.body;

    // Build update object with only allowed fields
    const updateData = {};
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.length > 100) {
        throw new AppError('Display name must be a string under 100 characters', 400);
      }
      updateData.display_name = displayName.trim();
    }
    if (avatarUrl !== undefined) {
      if (avatarUrl !== null && (typeof avatarUrl !== 'string' || avatarUrl.length > 500)) {
        throw new AppError('Avatar URL must be a string under 500 characters', 400);
      }
      updateData.avatar_url = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update profile', {
        userId: req.user.id,
        error: error.message,
        component: 'Auth',
      });
      throw new AppError('Failed to update profile', 500);
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        isAdmin: profile.is_admin,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
