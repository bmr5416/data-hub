/**
 * Supabase Client Singleton
 *
 * Provides a configured Supabase client for authentication.
 * Uses environment variables for URL and anon key.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

/**
 * Configured Supabase client instance
 * - persistSession: true - Sessions persist across page reloads
 * - detectSessionInUrl: false - We handle redirects manually
 * - autoRefreshToken: true - Automatically refresh expired tokens
 */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    storageKey: 'data-hub-auth',
  },
});

/**
 * Get current session access token
 * @returns {Promise<string|null>} The access token or null
 */
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}
