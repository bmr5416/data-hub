/**
 * LineageRepository
 *
 * Data access layer for data lineage operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';

class LineageRepository extends BaseRepository {
  constructor() {
    super('data_lineage', 'ln');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      sourceId: row.source_id,
      destinationType: row.destination_type,
      destinationId: row.destination_id,
      transformationDescription: row.transformation_description,
      createdAt: row.created_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId) row.client_id = data.clientId;
    }

    if (data.sourceId !== undefined) row.source_id = data.sourceId;
    if (data.destinationType !== undefined) row.destination_type = data.destinationType;
    if (data.destinationId !== undefined) row.destination_id = data.destinationId;
    if (data.transformationDescription !== undefined) {
      row.transformation_description = data.transformationDescription;
    }

    return row;
  }

  /**
   * Create lineage with client ID
   */
  async createForClient(clientId, data) {
    return this.create({ ...data, clientId });
  }

  /**
   * Find lineage by source
   */
  async findBySourceId(sourceId) {
    return this.findAll({ filters: { source_id: sourceId } });
  }

  /**
   * Find lineage by destination
   */
  async findByDestination(destinationType, destinationId) {
    return this.findAll({
      filters: {
        destination_type: destinationType,
        destination_id: destinationId,
      },
    });
  }

  /**
   * Find all lineage for a client
   */
  async findByClientId(clientId) {
    return this.findAll({ filters: { client_id: clientId } });
  }
}

export const lineageRepository = new LineageRepository();
