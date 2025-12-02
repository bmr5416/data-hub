/**
 * Authentication Context
 *
 * Provides Supabase Auth state and actions throughout the app.
 * Handles session persistence, auth state changes, and user profile loading.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Use environment variable for API base URL (consistent with api.js)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Auth state values:
 * - loading: Initial session check in progress
 * - authenticated: User has valid session
 * - unauthenticated: No session or session expired
 */
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

/**
 * AuthProvider - Wraps app with authentication context
 *
 * Manages:
 * - Session state (auto-restored from localStorage)
 * - Auth state changes (login, logout, token refresh)
 * - User profile from backend /api/auth/me
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [error, setError] = useState(null);

  /**
   * Fetch user profile from backend
   * Gets full profile with assigned clients
   */
  const fetchProfile = useCallback(async (accessToken) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token invalid, sign out
          await supabase.auth.signOut();
          return null;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data.user;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  }, []);

  /**
   * Handle session changes
   */
  const handleSession = useCallback(async (session) => {
    if (session?.user) {
      setUser(session.user);
      const userProfile = await fetchProfile(session.access_token);
      setProfile(userProfile);
      setAuthState(AUTH_STATES.AUTHENTICATED);
    } else {
      setUser(null);
      setProfile(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    }
  }, [fetchProfile]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setAuthState(AUTH_STATES.UNAUTHENTICATED);
          }
          return;
        }

        if (mounted) {
          await handleSession(session);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @throws {Error} If sign in fails
   */
  const signIn = useCallback(async (email, password) => {
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, []);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async () => {
    setError(null);

    // Notify backend (for audit logging)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      try {
        await fetch(`${API_BASE}/auth/signout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        // Ignore errors - signout should proceed regardless
      }
    }

    // Clear user-specific localStorage state for next user
    // This ensures onboarding wizard shows for new users on shared browsers
    localStorage.removeItem('datahub_onboarding_complete');

    await supabase.auth.signOut();
  }, []);

  /**
   * Refresh user profile from backend
   */
  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const userProfile = await fetchProfile(session.access_token);
      setProfile(userProfile);
    }
  }, [fetchProfile]);

  /**
   * Update user password
   * @param {string} newPassword
   */
  const updatePassword = useCallback(async (newPassword) => {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      throw updateError;
    }
  }, []);

  const value = useMemo(() => ({
    // State
    user,
    profile,
    authState,
    error,

    // Computed
    isLoading: authState === AUTH_STATES.LOADING,
    isAuthenticated: authState === AUTH_STATES.AUTHENTICATED,
    isAdmin: profile?.isAdmin ?? false,
    assignedClients: profile?.assignedClients ?? [],

    // Actions
    signIn,
    signOut,
    refreshProfile,
    updatePassword,
    clearError: () => setError(null),
  }), [user, profile, authState, error, signIn, signOut, refreshProfile, updatePassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access auth context
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user - Supabase user object
 * @property {Object|null} profile - User profile from backend
 * @property {string} authState - Current auth state
 * @property {string|null} error - Last auth error message
 * @property {boolean} isLoading - True during initial session check
 * @property {boolean} isAuthenticated - True if user has valid session
 * @property {boolean} isAdmin - True if user has admin privileges
 * @property {Array} assignedClients - User's assigned clients
 * @property {Function} signIn - Sign in with email/password
 * @property {Function} signOut - Sign out current user
 * @property {Function} refreshProfile - Refresh profile from backend
 * @property {Function} updatePassword - Update user password
 * @property {Function} clearError - Clear error state
 */
