import { useState, useEffect, useCallback } from 'react';
import { clientsApi, sourcesApi, etlApi, kpisApi, reportsApi, ApiError } from '../services/api';
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

export function useClients() {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientsApi.list();
      setClients(data.clients);
    } catch (err) {
      setError(toErrorState(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to be ready before fetching
    if (isAuthLoading || !isAuthenticated) return;
    fetchClients();
  }, [isAuthLoading, isAuthenticated, fetchClients]);

  return { clients, loading, error, refetch: fetchClients };
}

export function useClient(clientId) {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await clientsApi.get(clientId);
      setClient(data.client);
    } catch (err) {
      setError(toErrorState(err));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    // Wait for auth to be ready before fetching
    if (isAuthLoading || !isAuthenticated) return;
    fetchClient();
  }, [isAuthLoading, isAuthenticated, fetchClient]);

  const addSource = async (sourceData) => {
    setMutating(true);
    setError(null);
    try {
      const result = await clientsApi.addSource(clientId, sourceData);
      await fetchClient();
      return { success: true, data: result };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const addETL = async (etlData) => {
    setMutating(true);
    setError(null);
    try {
      const result = await clientsApi.addETL(clientId, etlData);
      await fetchClient();
      return { success: true, data: result };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const addKPI = async (kpiData) => {
    setMutating(true);
    setError(null);
    try {
      const result = await clientsApi.addKPI(clientId, kpiData);
      await fetchClient();
      return { success: true, data: result };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const addReport = async (reportData) => {
    setMutating(true);
    setError(null);
    try {
      const result = await clientsApi.addReport(clientId, reportData);
      await fetchClient();
      return { success: true, data: result };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const deleteSource = async (sourceId) => {
    setMutating(true);
    setError(null);
    try {
      await sourcesApi.delete(sourceId);
      await fetchClient();
      return { success: true };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const deleteETL = async (etlId) => {
    setMutating(true);
    setError(null);
    try {
      await etlApi.delete(etlId);
      await fetchClient();
      return { success: true };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const updateKPI = async (kpiId, kpiData) => {
    setMutating(true);
    setError(null);
    try {
      const result = await kpisApi.update(kpiId, kpiData);
      await fetchClient();
      return { success: true, data: result };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const deleteKPI = async (kpiId) => {
    setMutating(true);
    setError(null);
    try {
      await kpisApi.delete(kpiId);
      await fetchClient();
      return { success: true };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  const deleteReport = async (reportId) => {
    setMutating(true);
    setError(null);
    try {
      await reportsApi.delete(reportId);
      await fetchClient();
      return { success: true };
    } catch (err) {
      const errorState = toErrorState(err);
      setError(errorState);
      return { success: false, error: errorState.message };
    } finally {
      setMutating(false);
    }
  };

  return {
    client,
    loading,
    mutating,
    error,
    refetch: fetchClient,
    addSource,
    addETL,
    addKPI,
    addReport,
    deleteSource,
    deleteETL,
    updateKPI,
    deleteKPI,
    deleteReport,
  };
}
