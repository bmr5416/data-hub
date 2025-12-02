/**
 * Base Service
 *
 * Shared utilities for domain services:
 * - Supabase client access
 * - ID generation
 * - Generic row mapping
 * - Error handling
 */

import { supabase } from '../supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get the initialized Supabase client
 * @returns {Object} Supabase client
 * @throws {Error} If client not configured
 */
export function getClient() {
  if (!supabase) {
    throw new Error('Supabase client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabase;
}

/**
 * Generate a prefixed UUID
 * @param {string} prefix - ID prefix (e.g., 'c' for clients, 's' for sources)
 * @returns {string} Prefixed UUID
 */
export function generateId(prefix) {
  return `${prefix}-${uuidv4().slice(0, 8)}`;
}

/**
 * Map database row to JS object using field mapping
 * @param {Object} row - Database row
 * @param {Object} fieldMap - Mapping of db fields to JS fields
 * @returns {Object|null} Mapped object
 */
export function mapRow(row, fieldMap) {
  if (!row) return null;
  return Object.entries(fieldMap).reduce((acc, [dbField, jsField]) => {
    if (row[dbField] !== undefined) {
      acc[jsField] = row[dbField];
    }
    return acc;
  }, {});
}

/**
 * Map multiple database rows
 * @param {Array} rows - Database rows
 * @param {Object} fieldMap - Mapping of db fields to JS fields
 * @returns {Array} Mapped objects
 */
export function mapRows(rows, fieldMap) {
  return (rows || []).map(row => mapRow(row, fieldMap));
}

/**
 * Check if error is a "not found" error
 * @param {Object} error - Supabase error object
 * @returns {boolean} True if not found error
 */
export function isNotFoundError(error) {
  return error?.code === 'PGRST116';
}

/**
 * Handle query result with standard error handling
 * @param {Object} result - Supabase query result {data, error}
 * @param {Object} options - Options for handling
 * @param {Object} options.fieldMap - Field mapping for row transformation
 * @param {boolean} options.single - Whether result is a single row
 * @param {boolean} options.returnNull - Return null on not found (vs throwing)
 * @returns {Object|Array|null} Transformed result
 * @throws {Error} On database errors
 */
export function handleQueryResult({ data, error }, options = {}) {
  const { fieldMap, single = false, returnNull = true } = options;

  if (error) {
    if (returnNull && isNotFoundError(error)) {
      return null;
    }
    throw error;
  }

  if (!fieldMap) {
    return data;
  }

  return single ? mapRow(data, fieldMap) : mapRows(data, fieldMap);
}

/**
 * Get counts by client_id for multiple clients
 * @param {string} table - Table name
 * @param {Array} clientIds - Array of client IDs
 * @returns {Object} Map of clientId -> count
 */
export async function getCountsByClientId(table, clientIds) {
  if (!clientIds || clientIds.length === 0) return {};

  const { data, error } = await getClient()
    .from(table)
    .select('client_id')
    .in('client_id', clientIds);

  if (error) throw error;

  const counts = {};
  for (const row of data) {
    counts[row.client_id] = (counts[row.client_id] || 0) + 1;
  }
  return counts;
}
