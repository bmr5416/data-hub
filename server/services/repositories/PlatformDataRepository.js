/**
 * PlatformDataRepository
 *
 * Data access layer for platform data storage.
 * Handles JSONB data storage with batch insert and rollback patterns.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';
import logger from '../../utils/logger.js';

class PlatformDataRepository extends BaseRepository {
  constructor() {
    super('platform_data', 'pd');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      uploadId: row.upload_id,
      clientId: row.client_id,
      platformId: row.platform_id,
      rowIndex: row.row_index,
      rowData: row.row_data,
      createdAt: row.created_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.uploadId !== undefined) row.upload_id = data.uploadId;
      if (data.clientId !== undefined) row.client_id = data.clientId;
      if (data.platformId !== undefined) row.platform_id = data.platformId;
      if (data.rowIndex !== undefined) row.row_index = data.rowIndex;
    }

    if (data.rowData !== undefined) row.row_data = data.rowData;

    return row;
  }

  /**
   * Find platform data with optional filters and pagination
   * @param {string} clientId - Client ID
   * @param {string|null} platformId - Optional platform filter
   * @param {string|null} uploadId - Optional upload filter
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} { data, hasMore, total }
   */
  async findByClientId(clientId, platformId = null, uploadId = null, options = {}) {
    await this.init();

    const { limit, offset = 0 } = options;

    // Get total count first for pagination info
    let countQuery = supabase
      .from('platform_data')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    if (platformId) {
      countQuery = countQuery.eq('platform_id', platformId);
    }
    if (uploadId) {
      countQuery = countQuery.eq('upload_id', uploadId);
    }

    const { count: total, error: countError } = await countQuery;
    if (countError) throw countError;

    // Build data query
    let query = supabase
      .from('platform_data')
      .select('*')
      .eq('client_id', clientId)
      .order('row_index', { ascending: true });

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }
    if (uploadId) {
      query = query.eq('upload_id', uploadId);
    }

    // Apply pagination
    if (offset > 0) {
      query = query.range(offset, limit ? offset + limit - 1 : offset + 999);
    } else if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mappedData = data.map((row) => this.mapRow(row));

    return {
      data: mappedData,
      hasMore: limit ? (offset + data.length) < total : false,
      total: total || 0,
    };
  }

  /**
   * Find platform data by date range using JSONB field
   * @param {string} clientId - Client ID
   * @param {string|null} platformId - Optional platform filter
   * @param {string} startDate - Start date (inclusive)
   * @param {string} endDate - End date (inclusive)
   * @param {string} dateField - Field name in row_data to filter on
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} { data, hasMore, total }
   */
  async findByDateRange(clientId, platformId = null, startDate, endDate, dateField = 'date', options = {}) {
    await this.init();

    const { limit, offset = 0 } = options;

    // Get total count first for pagination info
    let countQuery = supabase
      .from('platform_data')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte(`row_data->>${dateField}`, startDate)
      .lte(`row_data->>${dateField}`, endDate);

    if (platformId) {
      countQuery = countQuery.eq('platform_id', platformId);
    }

    const { count: total, error: countError } = await countQuery;
    if (countError) throw countError;

    // Build data query
    let query = supabase
      .from('platform_data')
      .select('*')
      .eq('client_id', clientId)
      .gte(`row_data->>${dateField}`, startDate)
      .lte(`row_data->>${dateField}`, endDate)
      .order('row_index', { ascending: true });

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }

    // Apply pagination
    if (offset > 0) {
      query = query.range(offset, limit ? offset + limit - 1 : offset + 999);
    } else if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mappedData = data.map((row) => this.mapRow(row));

    return {
      data: mappedData,
      hasMore: limit ? (offset + data.length) < total : false,
      total: total || 0,
    };
  }

  /**
   * Count platform data rows
   * @param {string} clientId - Client ID
   * @param {Array<string>|null} platformIds - Optional platform ID filter
   * @returns {Promise<number>} Row count
   */
  async countByClientId(clientId, platformIds = null) {
    await this.init();

    let query = supabase
      .from('platform_data')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    if (platformIds && platformIds.length > 0) {
      query = query.in('platform_id', platformIds);
    }

    const { count, error } = await query;
    if (error) throw error;

    return count || 0;
  }

  /**
   * Get the latest upload date for a client's platforms
   * @param {string} clientId - Client ID
   * @param {Array<string>|null} platformIds - Optional platform ID filter
   * @returns {Promise<string|null>} Latest upload timestamp or null
   */
  async getLatestUploadDate(clientId, platformIds = null) {
    await this.init();

    let query = supabase
      .from('platform_uploads')
      .select('uploaded_at')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false })
      .limit(1);

    if (platformIds && platformIds.length > 0) {
      query = query.in('platform_id', platformIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data && data.length > 0 ? data[0].uploaded_at : null;
  }

  /**
   * Bulk insert platform data with transaction-safe rollback
   * @param {string} uploadId - Upload ID for this batch
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @param {Array<Object>} rows - Array of row data objects
   * @returns {Promise<number>} Number of rows inserted
   */
  async bulkInsert(uploadId, clientId, platformId, rows) {
    await this.init();

    const insertRows = rows.map((rowData, index) => ({
      id: this.generateId(),
      upload_id: uploadId,
      client_id: clientId,
      platform_id: platformId,
      row_index: index,
      row_data: rowData,
    }));

    // Insert in batches of 100 to avoid payload limits
    // Uses transaction-safe pattern: rollback all on failure
    const batchSize = 100;
    let totalInserted = 0;
    const insertedBatchIds = [];

    try {
      for (let i = 0; i < insertRows.length; i += batchSize) {
        const batch = insertRows.slice(i, i + batchSize);
        const batchIds = batch.map((row) => row.id);

        const { error } = await supabase.from('platform_data').insert(batch);
        if (error) throw error;

        insertedBatchIds.push(...batchIds);
        totalInserted += batch.length;
      }

      return totalInserted;
    } catch (error) {
      // Rollback: delete all rows inserted in this transaction
      if (insertedBatchIds.length > 0) {
        logger.warn('Bulk insert failed, rolling back inserted rows', {
          uploadId,
          platformId,
          insertedCount: insertedBatchIds.length,
          error: error.message,
        });

        try {
          // Delete by uploadId is more efficient than individual IDs
          await supabase
            .from('platform_data')
            .delete()
            .eq('upload_id', uploadId);
        } catch (rollbackError) {
          logger.error('Rollback failed during bulk insert', {
            uploadId,
            platformId,
            rollbackError: rollbackError.message,
          });
          // Still throw the original error
        }
      }

      throw error;
    }
  }

  /**
   * Delete platform data by filters
   * @param {string} clientId - Client ID
   * @param {string|null} platformId - Optional platform filter
   * @param {string|null} uploadId - Optional upload filter
   * @returns {Promise<boolean>} True on success
   */
  async deleteByClient(clientId, platformId = null, uploadId = null) {
    await this.init();

    let query = supabase.from('platform_data').delete().eq('client_id', clientId);

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }
    if (uploadId) {
      query = query.eq('upload_id', uploadId);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }
}

export const platformDataRepository = new PlatformDataRepository();
