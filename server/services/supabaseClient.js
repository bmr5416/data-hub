import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Load environment variables (needed before index.js dotenv.config runs due to ES module import hoisting)
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

/**
 * Service role Supabase client
 *
 * IMPORTANT: Use this ONLY for:
 * - Admin operations (user management, scheduled jobs)
 * - Operations that need to bypass RLS
 *
 * For user-initiated requests, use createUserClient() instead
 * to properly enforce Row Level Security.
 */
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Create a user-scoped Supabase client that respects RLS
 *
 * This client uses the anon key with the user's JWT token,
 * causing all queries to be filtered by RLS policies.
 *
 * @param {string} accessToken - User's JWT access token from auth middleware
 * @returns {import('@supabase/supabase-js').SupabaseClient} User-scoped client
 *
 * @example
 * // In a route handler with requireAuth middleware:
 * const userClient = createUserClient(req.token);
 * const { data, error } = await userClient
 *   .from('reports')
 *   .select('*'); // Will only return reports the user has access to
 */
export function createUserClient(accessToken) {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }

  // Use anon key if available, otherwise fall back to service key with auth header
  const key = supabaseAnonKey || supabaseServiceKey;

  if (!key) {
    throw new Error('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY must be configured');
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Get a user-scoped client from request object
 * Convenience wrapper for routes using requireAuth middleware
 *
 * @param {import('express').Request} req - Express request with token from auth middleware
 * @returns {import('@supabase/supabase-js').SupabaseClient} User-scoped client
 */
export function getUserClient(req) {
  if (!req.token) {
    throw new Error('Request does not have auth token. Ensure requireAuth middleware is used.');
  }
  return createUserClient(req.token);
}

export default supabase;
