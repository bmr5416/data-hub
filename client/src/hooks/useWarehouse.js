import { useState, useEffect, useCallback } from 'react';
import { warehouseApi, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Convert error to state object format
 * @param {Error} err - Error object
 * @returns {Object|null} Error state object
 */
function toErrorState(err) {
  if (err instanceof ApiError) {
    return err.toStateObject();
  }
  return { message: err.message, status: null, code: null, requestId: null, retryable: false };
}

/**
 * Hook for fetching warehouses for a specific client
 * @param {string} clientId - Client ID
 * @returns {Object} - Warehouses data, loading state, error, and refetch function
 */
export function useWarehouses(clientId) {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWarehouses = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await warehouseApi.list(clientId);
      setWarehouses(data.warehouses || []);
    } catch (err) {
      setError(toErrorState(err));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    // Wait for auth to be ready before fetching
    if (isAuthLoading || !isAuthenticated) return;
    fetchWarehouses();
  }, [isAuthLoading, isAuthenticated, fetchWarehouses]);

  const createWarehouse = useCallback(async (warehouseData) => {
    try {
      const result = await warehouseApi.create(clientId, warehouseData);
      await fetchWarehouses();
      return result.warehouse;
    } catch (err) {
      setError(toErrorState(err));
      throw err;
    }
  }, [clientId, fetchWarehouses]);

  return {
    warehouses,
    loading,
    error,
    refetch: fetchWarehouses,
    createWarehouse,
  };
}

/**
 * Hook for fetching a single warehouse with schema and stats
 * @param {string} warehouseId - Warehouse ID
 * @returns {Object} - Warehouse data, loading state, error, and refetch function
 */
export function useWarehouse(warehouseId) {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWarehouse = useCallback(async () => {
    if (!warehouseId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await warehouseApi.get(warehouseId);
      setWarehouse(data.warehouse);
    } catch (err) {
      setError(toErrorState(err));
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    // Wait for auth to be ready before fetching
    if (isAuthLoading || !isAuthenticated) return;
    fetchWarehouse();
  }, [isAuthLoading, isAuthenticated, fetchWarehouse]);

  const updateWarehouse = useCallback(async (updates) => {
    try {
      await warehouseApi.update(warehouseId, updates);
      await fetchWarehouse();
    } catch (err) {
      setError(toErrorState(err));
      throw err;
    }
  }, [warehouseId, fetchWarehouse]);

  const deleteWarehouse = useCallback(async () => {
    try {
      await warehouseApi.delete(warehouseId);
    } catch (err) {
      setError(toErrorState(err));
      throw err;
    }
  }, [warehouseId]);

  return {
    warehouse,
    loading,
    error,
    refetch: fetchWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
}
