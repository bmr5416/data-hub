import { useState, useCallback } from 'react';
import { notesApi } from '../services/api';

/**
 * Hook for managing entity notes with lazy loading
 *
 * @param {string} entityType - 'source' | 'etl' | 'kpi' | 'report' | 'client'
 * @param {string} entityId - The entity's unique ID
 * @returns {Object} Notes state and operations
 */
export function useNotes(entityType, entityId) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchNote = useCallback(async () => {
    if (!entityType || !entityId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await notesApi.get(entityType, entityId);
      setNote(data);
    } catch (err) {
      // 404 means no note exists yet, which is fine
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setNote(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  const saveNote = useCallback(
    async (content, updatedBy = 'user') => {
      if (!entityType || !entityId) {
        return { success: false, error: 'Missing entity type or ID' };
      }

      try {
        setSaving(true);
        setError(null);
        const result = await notesApi.save(entityType, entityId, content, updatedBy);
        setNote(result);
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setSaving(false);
      }
    },
    [entityType, entityId]
  );

  const deleteNote = useCallback(async () => {
    if (!entityType || !entityId) {
      return { success: false, error: 'Missing entity type or ID' };
    }

    try {
      setSaving(true);
      setError(null);
      await notesApi.delete(entityType, entityId);
      setNote(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [entityType, entityId]);

  return {
    note,
    loading,
    saving,
    error,
    fetchNote,
    saveNote,
    deleteNote,
  };
}

export default useNotes;
