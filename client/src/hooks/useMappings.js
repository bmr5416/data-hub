import { useState, useCallback } from 'react';
import { mappingsApi } from '../services/api';

/**
 * Hook for managing platform field mappings
 *
 * @param {string} clientId - The client's unique ID
 * @returns {Object} Mappings state and operations
 */
export function useMappings(clientId) {
  const [mappings, setMappings] = useState([]);
  const [platformMappings, setPlatformMappings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all custom mappings for the client
   */
  const fetchMappings = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      const { mappings: data } = await mappingsApi.list(clientId);
      setMappings(data || []);
    } catch (err) {
      setError(err.message);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Fetch merged mappings (custom + defaults) for a specific platform
   */
  const fetchPlatformMappings = useCallback(
    async (platformId) => {
      if (!clientId || !platformId) return;

      try {
        setLoading(true);
        setError(null);
        const { mappings: data } = await mappingsApi.get(clientId, platformId);
        setPlatformMappings(data);
        return data;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clientId]
  );

  /**
   * Create a custom mapping
   */
  const createMapping = useCallback(
    async (data) => {
      if (!clientId) {
        return { success: false, error: 'Missing client ID' };
      }

      try {
        setError(null);
        const { mapping } = await mappingsApi.create(clientId, data);
        // Refresh mappings list
        await fetchMappings();
        return { success: true, mapping };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [clientId, fetchMappings]
  );

  /**
   * Update an existing mapping
   */
  const updateMapping = useCallback(
    async (mappingId, data) => {
      try {
        setError(null);
        const { mapping } = await mappingsApi.update(mappingId, data);
        // Refresh mappings list
        await fetchMappings();
        return { success: true, mapping };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [fetchMappings]
  );

  /**
   * Delete a custom mapping (reverts to system default)
   */
  const deleteMapping = useCallback(
    async (mappingId) => {
      try {
        setError(null);
        await mappingsApi.delete(mappingId);
        // Update local state
        setMappings((prev) => prev.filter((m) => m.id !== mappingId));
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    []
  );

  /**
   * Reset all mappings for a platform to system defaults
   */
  const resetPlatformMappings = useCallback(
    async (platformId) => {
      if (!clientId) {
        return { success: false, error: 'Missing client ID' };
      }

      try {
        setError(null);
        const result = await mappingsApi.reset(clientId, platformId);
        // Refresh mappings list
        await fetchMappings();
        return { success: true, ...result };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [clientId, fetchMappings]
  );

  return {
    mappings,
    platformMappings,
    loading,
    error,
    fetchMappings,
    fetchPlatformMappings,
    createMapping,
    updateMapping,
    deleteMapping,
    resetPlatformMappings,
  };
}

export default useMappings;
