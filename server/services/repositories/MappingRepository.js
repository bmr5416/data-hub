/**
 * MappingRepository
 *
 * Data access layer for platform field mappings.
 * Handles mapping of platform-specific fields to canonical fields.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class MappingRepository extends BaseRepository {
  constructor() {
    super('platform_mappings', 'pm');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      platformId: row.platform_id,
      fieldType: row.field_type,
      canonicalId: row.canonical_id,
      platformFieldName: row.platform_field_name,
      transformation: row.transformation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId !== undefined) row.client_id = data.clientId;
      if (data.platformId !== undefined) row.platform_id = data.platformId;
      if (data.fieldType !== undefined) row.field_type = data.fieldType;
      if (data.canonicalId !== undefined) row.canonical_id = data.canonicalId;
    }

    if (data.platformFieldName !== undefined) row.platform_field_name = data.platformFieldName;
    if (data.transformation !== undefined) row.transformation = data.transformation;

    return row;
  }

  /**
   * Find mappings by client ID and optionally platform ID
   * @param {string} clientId - Client ID
   * @param {string|null} platformId - Optional platform ID filter
   * @returns {Promise<Array>} Array of mappings
   */
  async findByClientId(clientId, platformId = null) {
    await this.init();

    let query = supabase
      .from('platform_mappings')
      .select('*')
      .eq('client_id', clientId);

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => this.mapRow(row));
  }

  /**
   * Find mappings by client and platform
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @returns {Promise<Array>} Array of mappings
   */
  async findByClientAndPlatform(clientId, platformId) {
    return this.findByClientId(clientId, platformId);
  }

  /**
   * Delete all mappings for a client and platform
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @returns {Promise<boolean>} True on success
   */
  async deleteByClientAndPlatform(clientId, platformId) {
    await this.init();

    const { error } = await supabase
      .from('platform_mappings')
      .delete()
      .eq('client_id', clientId)
      .eq('platform_id', platformId);

    if (error) throw error;
    return true;
  }
}

export const mappingRepository = new MappingRepository();
