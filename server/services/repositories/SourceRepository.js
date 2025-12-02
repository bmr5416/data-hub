/**
 * SourceRepository
 *
 * Data access layer for data source operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';

class SourceRepository extends BaseRepository {
  constructor() {
    super('data_sources', 's');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      platform: row.platform,
      sourceType: row.source_type,
      connectionMethod: row.connection_method,
      refreshFrequency: row.refresh_frequency,
      status: row.status,
      credentialsLocation: row.credentials_location,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId) row.client_id = data.clientId;
    }

    if (data.name !== undefined) row.name = data.name;
    if (data.platform !== undefined) row.platform = data.platform;
    if (data.sourceType !== undefined) row.source_type = data.sourceType;
    if (data.connectionMethod !== undefined) row.connection_method = data.connectionMethod;
    if (data.refreshFrequency !== undefined) row.refresh_frequency = data.refreshFrequency;
    if (data.status !== undefined) row.status = data.status;
    if (data.credentialsLocation !== undefined) row.credentials_location = data.credentialsLocation;
    if (data.notes !== undefined) row.notes = data.notes;

    return row;
  }

  /**
   * Create source with client ID
   */
  async createForClient(clientId, data) {
    return this.create({ ...data, clientId });
  }

  /**
   * Find sources by platform
   */
  async findByPlatform(platform) {
    return this.findAll({ filters: { platform } });
  }

  /**
   * Find sources by status
   */
  async findByStatus(status) {
    return this.findAll({ filters: { status } });
  }
}

export const sourceRepository = new SourceRepository();
