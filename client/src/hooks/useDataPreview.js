import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from './useNotification';

/**
 * useDataPreview - Data preview fetching with row limit controls
 *
 * Handles the common pattern of fetching preview data with configurable
 * row limits and automatic refetching on dependency changes.
 *
 * @param {Object} options
 * @param {Function} options.fetchFn - Async function that fetches preview data
 *   Should accept (rowLimit) and return { columns, rows, totalRows }
 * @param {boolean} [options.enabled=true] - Whether fetching is enabled (e.g., modal is open)
 * @param {number} [options.initialRowLimit=10] - Initial row limit
 *
 * @returns {Object} Preview state and controls
 *
 * @example
 * // Simple usage
 * const {
 *   showPreview,
 *   setShowPreview,
 *   previewData,
 *   previewLoading,
 *   rowLimit,
 *   setRowLimit,
 * } = useDataPreview({
 *   fetchFn: async (limit) => {
 *     return await api.getPreview(clientId, platformId, limit);
 *   },
 * });
 *
 * @example
 * // With platform selection
 * const [selectedPlatform, setSelectedPlatform] = useState(null);
 * const {
 *   showPreview,
 *   setShowPreview,
 *   previewData,
 *   previewLoading,
 *   rowLimit,
 *   setRowLimit,
 * } = useDataPreview({
 *   fetchFn: useCallback(async (limit) => {
 *     if (!selectedPlatform) return { columns: [], rows: [], totalRows: 0 };
 *     return await api.getPreview(clientId, selectedPlatform, limit);
 *   }, [clientId, selectedPlatform]),
 *   enabled: !!selectedPlatform,
 * });
 */
export function useDataPreview({
  fetchFn,
  enabled = true,
  initialRowLimit = 10,
}) {
  const { showError } = useNotification();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    columns: [],
    rows: [],
    totalRows: 0,
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rowLimit, setRowLimit] = useState(initialRowLimit);

  // Compute whether we should actually fetch
  const shouldFetch = useMemo(() => showPreview && enabled, [showPreview, enabled]);

  const fetchPreview = useCallback(async () => {
    if (!fetchFn) return;

    setPreviewLoading(true);
    try {
      const limit = rowLimit === 'all' ? 'all' : rowLimit;
      const result = await fetchFn(limit);
      setPreviewData(result);
    } catch (error) {
      showError(error.message || 'Failed to load preview');
      setPreviewData({
        columns: [],
        rows: [],
        totalRows: 0,
        error: error.message,
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [fetchFn, rowLimit, showError]);

  // Fetch preview when conditions change
  useEffect(() => {
    if (!shouldFetch) return;
    fetchPreview();
  }, [shouldFetch, fetchPreview]);

  // Reset preview data when closing
  const closePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  // Open preview
  const openPreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  return {
    showPreview,
    setShowPreview,
    previewData,
    previewLoading,
    rowLimit,
    setRowLimit,
    fetchPreview,
    openPreview,
    closePreview,
  };
}

export default useDataPreview;
