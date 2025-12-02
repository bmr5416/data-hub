/**
 * BlendedDataRepository
 *
 * Data access layer for blended/harmonized data storage.
 * Handles combined data from multiple platforms.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class BlendedDataRepository extends BaseRepository {
  constructor() {
    super('blended_data', 'bd');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      batchId: row.blend_batch_id,
      rowData: row.row_data,
      sourcePlatforms: row.source_platforms || [],
      blendedAt: row.blended_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId !== undefined) row.client_id = data.clientId;
      if (data.batchId !== undefined) row.blend_batch_id = data.batchId;
      if (data.sourcePlatforms !== undefined) row.source_platforms = data.sourcePlatforms;
    }

    if (data.rowData !== undefined) row.row_data = data.rowData;

    return row;
  }

  /**
   * Find blended data by client with optional batch filter
   * @param {string} clientId - Client ID
   * @param {string|null} batchId - Optional batch ID filter
   * @returns {Promise<Array>} Array of blended data rows
   */
  async findByClientId(clientId, batchId = null) {
    await this.init();

    let query = supabase
      .from('blended_data')
      .select('*')
      .eq('client_id', clientId)
      .order('blended_at', { ascending: false });

    if (batchId) {
      query = query.eq('blend_batch_id', batchId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((row) => this.mapRow(row));
  }

  /**
   * Get the latest blend batch for a client
   * @param {string} clientId - Client ID
   * @returns {Promise<Object|null>} { batchId, blendedAt } or null
   */
  async getLatestBatch(clientId) {
    await this.init();

    const { data, error } = await supabase
      .from('blended_data')
      .select('blend_batch_id, blended_at')
      .eq('client_id', clientId)
      .order('blended_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      batchId: data.blend_batch_id,
      blendedAt: data.blended_at,
    };
  }

  /**
   * Bulk insert blended data rows
   * @param {string} clientId - Client ID
   * @param {string} batchId - Batch ID for this blend operation
   * @param {Array<Object>} rows - Array of row data objects
   * @param {Array<string>} sourcePlatforms - Array of source platform IDs
   * @returns {Promise<number>} Number of rows inserted
   */
  async bulkInsert(clientId, batchId, rows, sourcePlatforms) {
    await this.init();

    const insertRows = rows.map((rowData) => ({
      id: this.generateId(),
      client_id: clientId,
      blend_batch_id: batchId,
      row_data: rowData,
      source_platforms: sourcePlatforms,
    }));

    // Insert in batches of 100
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < insertRows.length; i += batchSize) {
      const batch = insertRows.slice(i, i + batchSize);
      const { error } = await supabase.from('blended_data').insert(batch);
      if (error) throw error;
      totalInserted += batch.length;
    }

    return totalInserted;
  }

  /**
   * Delete blended data by client with optional batch filter
   * @param {string} clientId - Client ID
   * @param {string|null} batchId - Optional batch ID filter
   * @returns {Promise<boolean>} True on success
   */
  async deleteByClient(clientId, batchId = null) {
    await this.init();

    let query = supabase.from('blended_data').delete().eq('client_id', clientId);

    if (batchId) {
      query = query.eq('blend_batch_id', batchId);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }
}

export const blendedDataRepository = new BlendedDataRepository();
