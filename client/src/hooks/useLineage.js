import { useState, useCallback } from 'react';
import { lineageApi } from '../services/api';

/**
 * Hook for managing data lineage connections
 *
 * @param {string} clientId - The client's unique ID
 * @returns {Object} Lineage state and operations
 */
export function useLineage(clientId) {
  const [lineage, setLineage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLineage = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await lineageApi.get(clientId);
      setLineage(data?.lineage || []);
    } catch (err) {
      setError(err.message);
      setLineage([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const createConnection = useCallback(
    async (connectionData) => {
      if (!clientId) {
        return { success: false, error: 'Missing client ID' };
      }

      try {
        setError(null);
        const result = await lineageApi.create({
          clientId,
          ...connectionData,
        });
        // Refetch to get updated list
        await fetchLineage();
        return { success: true, data: result };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [clientId, fetchLineage]
  );

  const deleteConnection = useCallback(
    async (connectionId) => {
      try {
        setError(null);
        await lineageApi.delete(connectionId);
        // Update local state optimistically
        setLineage((prev) => prev.filter((item) => item.id !== connectionId));
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    []
  );

  return {
    lineage,
    loading,
    error,
    fetchLineage,
    createConnection,
    deleteConnection,
  };
}

export default useLineage;
