import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api, { ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Convert error to state object format
 */
function toErrorState(err) {
  if (err instanceof ApiError) {
    return err.toStateObject();
  }
  return { message: err.message, status: null, code: null, requestId: null, retryable: false };
}

// Module-level cache for platforms data (shared across all hook instances)
let platformsCache = null;
let cachePromise = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cacheTimestamp = 0;

/**
 * Hook to fetch platforms from the API
 * Idempotent: Multiple calls share the same cached data
 * Ensures client-side platform list stays in sync with server
 */
export function usePlatforms() {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [platforms, setPlatforms] = useState(platformsCache || []);
  const [loading, setLoading] = useState(!platformsCache);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchPlatforms = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheValid = platformsCache && (now - cacheTimestamp) < CACHE_TTL;

    // Return cached data if valid and not forcing refresh
    if (cacheValid && !forceRefresh) {
      if (mountedRef.current) {
        setPlatforms(platformsCache);
        setLoading(false);
      }
      return;
    }

    // If a fetch is already in progress, wait for it
    if (cachePromise && !forceRefresh) {
      try {
        const data = await cachePromise;
        if (mountedRef.current) {
          setPlatforms(data);
          setLoading(false);
        }
        return;
      } catch {
        // Fall through to new fetch
      }
    }

    // Start new fetch
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    cachePromise = api.get('/platforms');

    try {
      const data = await cachePromise;
      platformsCache = data;
      cacheTimestamp = Date.now();
      if (mountedRef.current) {
        setPlatforms(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(toErrorState(err));
        // Use cached data if available, otherwise empty array
        setPlatforms(platformsCache || []);
      }
    } finally {
      cachePromise = null;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Wait for auth to be ready before fetching
    if (isAuthLoading || !isAuthenticated) return;
    fetchPlatforms();
    return () => {
      mountedRef.current = false;
    };
  }, [isAuthLoading, isAuthenticated, fetchPlatforms]);

  // Memoized helpers
  const platformIds = useMemo(() => platforms.map(p => p.id), [platforms]);

  const getPlatformById = useCallback((id) => {
    return platforms.find(p => p.id === id);
  }, [platforms]);

  const formatPlatformName = useCallback((platformId) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? platform.name : platformId.replace(/_/g, ' ').toUpperCase();
  }, [platforms]);

  // Get platforms grouped by category
  const platformsByCategory = useMemo(() => {
    return platforms.reduce((acc, platform) => {
      const category = platform.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(platform);
      return acc;
    }, {});
  }, [platforms]);

  return {
    platforms,
    platformIds,
    platformsByCategory,
    loading,
    error,
    refetch: () => fetchPlatforms(true),
    getPlatformById,
    formatPlatformName,
  };
}

/**
 * Clear the platforms cache (useful for testing or forced refresh)
 */
export function clearPlatformsCache() {
  platformsCache = null;
  cacheTimestamp = 0;
  cachePromise = null;
}
