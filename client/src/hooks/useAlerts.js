import { useState, useCallback } from 'react';
import { alertsApi } from '../services/api';

/**
 * Hook for managing KPI alerts
 *
 * @param {string} kpiId - The KPI's unique ID
 * @returns {Object} Alerts state and operations
 */
export function useAlerts(kpiId) {
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all alerts for the KPI
   */
  const fetchAlerts = useCallback(async () => {
    if (!kpiId) return;

    try {
      setLoading(true);
      setError(null);
      const { alerts: data } = await alertsApi.list(kpiId);
      setAlerts(data || []);
    } catch (err) {
      setError(err.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [kpiId]);

  /**
   * Create a new alert
   */
  const createAlert = useCallback(
    async (data) => {
      if (!kpiId) {
        return { success: false, error: 'Missing KPI ID' };
      }

      try {
        setError(null);
        const { alert } = await alertsApi.create(kpiId, data);
        setAlerts((prev) => [...prev, alert]);
        return { success: true, alert };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [kpiId]
  );

  /**
   * Update an existing alert
   */
  const updateAlert = useCallback(
    async (alertId, data) => {
      try {
        setError(null);
        const { alert } = await alertsApi.update(alertId, data);
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? alert : a)));
        return { success: true, alert };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    []
  );

  /**
   * Delete an alert
   */
  const deleteAlert = useCallback(async (alertId) => {
    try {
      setError(null);
      await alertsApi.delete(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Toggle an alert's active status
   */
  const toggleAlert = useCallback(
    async (alertId, active) => {
      return updateAlert(alertId, { active });
    },
    [updateAlert]
  );

  /**
   * Fetch trigger history for an alert
   */
  const fetchHistory = useCallback(async (alertId, limit = 100) => {
    try {
      setError(null);
      const { history: data } = await alertsApi.getHistory(alertId, limit);
      setHistory(data || []);
      return { success: true, history: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Manually evaluate alerts for a KPI value
   */
  const evaluateAlerts = useCallback(
    async (currentValue) => {
      if (!kpiId) {
        return { success: false, error: 'Missing KPI ID' };
      }

      try {
        setError(null);
        const result = await alertsApi.evaluate(kpiId, currentValue);
        return { success: true, ...result };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [kpiId]
  );

  return {
    alerts,
    history,
    loading,
    error,
    fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    fetchHistory,
    evaluateAlerts,
  };
}

export default useAlerts;
