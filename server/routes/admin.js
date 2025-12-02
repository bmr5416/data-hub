/**
 * Admin Routes
 *
 * Provides administrative endpoints for user management.
 * All routes require authentication AND admin privileges.
 * Implements invite-only user creation via Supabase Auth Admin API.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../services/supabaseClient.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// All admin routes require authentication AND admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * Rate limiter for admin actions
 * More restrictive for sensitive operations
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: { error: { message: 'Too many admin requests. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/admin/users
 * List all users with their profiles and assignments
 */
router.get('/users', async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const page = parseInt(req.query.page) || 1;
    const perPage = Math.min(parseInt(req.query.perPage) || 50, 100);

    // List users from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (authError) {
      logger.error('Failed to list users', {
        error: authError.message,
        component: 'Admin',
      });
      throw new AppError('Failed to list users', 500);
    }

    const users = authData.users;

    // Get user profiles for all users
    const userIds = users.map((u) => u.id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Get client assignments for all users
    const { data: assignments } = await supabase
      .from('user_client_assignments')
      .select(`
        user_id,
        client_id,
        role,
        clients (
          id,
          name
        )
      `)
      .in('user_id', userIds);

    // Group assignments by user
    const assignmentsMap = new Map();
    (assignments || []).forEach((a) => {
      if (!assignmentsMap.has(a.user_id)) {
        assignmentsMap.set(a.user_id, []);
      }
      assignmentsMap.get(a.user_id).push({
        clientId: a.client_id,
        role: a.role,
        clientName: a.clients?.name,
      });
    });

    // Combine data
    const enrichedUsers = users.map((user) => {
      const profile = profilesMap.get(user.id);
      return {
        id: user.id,
        email: user.email,
        emailConfirmed: !!user.email_confirmed_at,
        isAdmin: profile?.is_admin || user.user_metadata?.is_admin || false,
        isActive: profile?.is_active ?? true,
        displayName: profile?.display_name || user.email.split('@')[0],
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        assignedClients: assignmentsMap.get(user.id) || [],
      };
    });

    res.json({
      users: enrichedUsers,
      pagination: {
        page,
        perPage,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id
 * Get a specific user with full details
 */
router.get('/users/:id', async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const { id } = req.params;

    // Get user from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(id);

    if (authError || !authData.user) {
      throw new AppError('User not found', 404);
    }

    const user = authData.user;

    // Get profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    // Get assignments
    const { data: assignments } = await supabase
      .from('user_client_assignments')
      .select(`
        client_id,
        role,
        assigned_at,
        assigned_by,
        clients (
          id,
          name,
          status
        )
      `)
      .eq('user_id', id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: !!user.email_confirmed_at,
        isAdmin: profile?.is_admin || user.user_metadata?.is_admin || false,
        isActive: profile?.is_active ?? true,
        displayName: profile?.display_name || user.email.split('@')[0],
        avatarUrl: profile?.avatar_url,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        assignedClients: assignments?.map((a) => ({
          clientId: a.client_id,
          role: a.role,
          assignedAt: a.assigned_at,
          assignedBy: a.assigned_by,
          client: a.clients,
        })) || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users
 * Invite a new user (creates account and sends invite email)
 */
router.post('/users', adminLimiter, async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const { email, displayName, isAdmin = false, assignedClients = [] } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      throw new AppError('Email is required', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AppError('Invalid email format', 400);
    }

    // Validate display name if provided
    if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 100)) {
      throw new AppError('Display name must be a string under 100 characters', 400);
    }

    // Validate assigned clients if provided
    if (assignedClients.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .in('id', assignedClients);

      const validClientIds = new Set(clients?.map((c) => c.id) || []);
      const invalidClients = assignedClients.filter((id) => !validClientIds.has(id));

      if (invalidClients.length > 0) {
        throw new AppError(`Invalid client IDs: ${invalidClients.join(', ')}`, 400);
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: false, // Will require email confirmation
      user_metadata: {
        is_admin: isAdmin,
        invited_by: req.user.id,
        invited_at: new Date().toISOString(),
      },
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        throw new AppError('User with this email already exists', 409);
      }
      logger.error('Failed to create user', {
        email: normalizedEmail,
        error: authError.message,
        component: 'Admin',
      });
      throw new AppError('Failed to create user', 500);
    }

    const newUser = authData.user;

    // Update user profile with display name
    if (displayName) {
      await supabase
        .from('user_profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', newUser.id);
    }

    // Create client assignments
    if (assignedClients.length > 0) {
      const assignmentRecords = assignedClients.map((clientId) => ({
        user_id: newUser.id,
        client_id: clientId,
        role: 'viewer', // Default role
        assigned_by: req.user.id,
      }));

      const { error: assignError } = await supabase
        .from('user_client_assignments')
        .insert(assignmentRecords);

      if (assignError) {
        logger.error('Failed to create client assignments', {
          userId: newUser.id,
          error: assignError.message,
          component: 'Admin',
        });
        // Don't fail - user was created
      }
    }

    // Send invite email
    let inviteSent = false;
    try {
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail);
      inviteSent = !inviteError;
      if (inviteError) {
        logger.warn('Failed to send invite email', {
          email: normalizedEmail,
          error: inviteError.message,
          component: 'Admin',
        });
      }
    } catch (inviteErr) {
      logger.warn('Failed to send invite email', {
        email: normalizedEmail,
        error: inviteErr.message,
        component: 'Admin',
      });
    }

    logger.info('User invited', {
      userId: newUser.id,
      email: normalizedEmail,
      isAdmin,
      invitedBy: req.user.id,
      clientCount: assignedClients.length,
      inviteSent,
      component: 'Admin',
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        isAdmin,
        displayName: displayName?.trim() || normalizedEmail.split('@')[0],
        assignedClients,
        inviteSent,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id
 * Update a user (admin status, assigned clients, active status)
 */
router.put('/users/:id', adminLimiter, async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const { id } = req.params;
    const { displayName, isAdmin, isActive, assignedClients } = req.body;

    // Prevent self-demotion from admin
    if (id === req.user.id && isAdmin === false) {
      throw new AppError('Cannot remove your own admin status', 400);
    }

    // Check user exists
    const { data: authData, error: fetchError } = await supabase.auth.admin.getUserById(id);
    if (fetchError || !authData.user) {
      throw new AppError('User not found', 404);
    }

    // Validate assigned clients if provided
    if (assignedClients !== undefined && assignedClients.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .in('id', assignedClients);

      const validClientIds = new Set(clients?.map((c) => c.id) || []);
      const invalidClients = assignedClients.filter((cid) => !validClientIds.has(cid));

      if (invalidClients.length > 0) {
        throw new AppError(`Invalid client IDs: ${invalidClients.join(', ')}`, 400);
      }
    }

    // Update Supabase Auth user metadata (admin status)
    if (isAdmin !== undefined) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
          ...authData.user.user_metadata,
          is_admin: isAdmin,
        },
      });

      if (authUpdateError) {
        logger.error('Failed to update auth user metadata', {
          userId: id,
          error: authUpdateError.message,
          component: 'Admin',
        });
        throw new AppError('Failed to update user', 500);
      }
    }

    // Update user profile
    const profileUpdate = {};
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.length > 100) {
        throw new AppError('Display name must be a string under 100 characters', 400);
      }
      profileUpdate.display_name = displayName.trim();
    }
    if (isAdmin !== undefined) {
      profileUpdate.is_admin = isAdmin;
    }
    if (isActive !== undefined) {
      profileUpdate.is_active = isActive;
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', id);

      if (profileError) {
        logger.error('Failed to update user profile', {
          userId: id,
          error: profileError.message,
          component: 'Admin',
        });
        throw new AppError('Failed to update user profile', 500);
      }
    }

    // Update client assignments if provided
    if (assignedClients !== undefined) {
      // Delete existing assignments
      await supabase
        .from('user_client_assignments')
        .delete()
        .eq('user_id', id);

      // Insert new assignments
      if (assignedClients.length > 0) {
        const assignmentRecords = assignedClients.map((clientId) => ({
          user_id: id,
          client_id: clientId,
          role: 'viewer',
          assigned_by: req.user.id,
        }));

        await supabase
          .from('user_client_assignments')
          .insert(assignmentRecords);
      }
    }

    // Fetch updated user
    const { data: updatedAuthData } = await supabase.auth.admin.getUserById(id);
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    const { data: assignments } = await supabase
      .from('user_client_assignments')
      .select('client_id, role')
      .eq('user_id', id);

    logger.info('User updated', {
      userId: id,
      updatedBy: req.user.id,
      changes: { isAdmin, isActive, displayName: !!displayName, clientCount: assignedClients?.length },
      component: 'Admin',
    });

    res.json({
      user: {
        id,
        email: updatedAuthData.user.email,
        isAdmin: profile?.is_admin || updatedAuthData.user.user_metadata?.is_admin || false,
        isActive: profile?.is_active ?? true,
        displayName: profile?.display_name || updatedAuthData.user.email.split('@')[0],
        assignedClients: assignments?.map((a) => a.client_id) || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id/clients
 * Update a user's client assignments with specific roles
 */
router.put('/users/:id/clients', adminLimiter, async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const { id } = req.params;
    const { assignments } = req.body; // Array of { clientId, role }

    // Validate assignments format
    if (!Array.isArray(assignments)) {
      throw new AppError('Assignments must be an array', 400);
    }

    const validRoles = ['viewer', 'editor', 'admin'];
    for (const a of assignments) {
      if (!a.clientId || !a.role) {
        throw new AppError('Each assignment must have clientId and role', 400);
      }
      if (!validRoles.includes(a.role)) {
        throw new AppError(`Invalid role: ${a.role}. Must be one of: ${validRoles.join(', ')}`, 400);
      }
    }

    // Check user exists
    const { error: fetchError } = await supabase.auth.admin.getUserById(id);
    if (fetchError) {
      throw new AppError('User not found', 404);
    }

    // Validate client IDs
    const clientIds = assignments.map((a) => a.clientId);
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .in('id', clientIds);

      const validClientIds = new Set(clients?.map((c) => c.id) || []);
      const invalidClients = clientIds.filter((cid) => !validClientIds.has(cid));

      if (invalidClients.length > 0) {
        throw new AppError(`Invalid client IDs: ${invalidClients.join(', ')}`, 400);
      }
    }

    // Delete existing assignments
    await supabase
      .from('user_client_assignments')
      .delete()
      .eq('user_id', id);

    // Insert new assignments
    if (assignments.length > 0) {
      const assignmentRecords = assignments.map((a) => ({
        user_id: id,
        client_id: a.clientId,
        role: a.role,
        assigned_by: req.user.id,
      }));

      const { error: insertError } = await supabase
        .from('user_client_assignments')
        .insert(assignmentRecords);

      if (insertError) {
        throw new AppError('Failed to update client assignments', 500);
      }
    }

    logger.info('User client assignments updated', {
      userId: id,
      updatedBy: req.user.id,
      assignmentCount: assignments.length,
      component: 'Admin',
    });

    res.json({
      success: true,
      assignments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', adminLimiter, async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      throw new AppError('Cannot delete your own account', 400);
    }

    // Check user exists
    const { data: authData, error: fetchError } = await supabase.auth.admin.getUserById(id);
    if (fetchError || !authData.user) {
      throw new AppError('User not found', 404);
    }

    const userEmail = authData.user.email;

    // Delete user profile first (cascade will handle assignments)
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    // Delete from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
    if (deleteError) {
      logger.error('Failed to delete user from auth', {
        userId: id,
        error: deleteError.message,
        component: 'Admin',
      });
      throw new AppError('Failed to delete user', 500);
    }

    logger.info('User deleted', {
      userId: id,
      email: userEmail,
      deletedBy: req.user.id,
      component: 'Admin',
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/resend-invite
 * Resend invite email to a user
 */
router.post('/users/:id/resend-invite', adminLimiter, async (req, res, next) => {
  try {
    if (!supabase) {
      throw new AppError('Database not configured', 500);
    }

    const { id } = req.params;

    // Get user
    const { data: authData, error: fetchError } = await supabase.auth.admin.getUserById(id);
    if (fetchError || !authData.user) {
      throw new AppError('User not found', 404);
    }

    const user = authData.user;

    if (user.email_confirmed_at) {
      throw new AppError('User has already confirmed their email', 400);
    }

    // Send invite email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(user.email);
    if (inviteError) {
      logger.error('Failed to resend invite', {
        userId: id,
        error: inviteError.message,
        component: 'Admin',
      });
      throw new AppError('Failed to send invite email', 500);
    }

    logger.info('Invite resent', {
      userId: id,
      email: user.email,
      sentBy: req.user.id,
      component: 'Admin',
    });

    res.json({ success: true, message: 'Invite sent' });
  } catch (error) {
    next(error);
  }
});

export default router;
