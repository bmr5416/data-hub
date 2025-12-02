/**
 * ETLRepository
 *
 * Data access layer for ETL process operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';

class ETLRepository extends BaseRepository {
  constructor() {
    super('etl_processes', 'e');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      sourceIds: row.source_ids,
      destination: row.destination,
      transformDescription: row.transform_description,
      schedule: row.schedule,
      orchestrator: row.orchestrator,
      status: row.status,
      lastRun: row.last_run,
      documentationUrl: row.documentation_url,
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
    if (data.sourceIds !== undefined) row.source_ids = data.sourceIds;
    if (data.destination !== undefined) row.destination = data.destination;
    if (data.transformDescription !== undefined) row.transform_description = data.transformDescription;
    if (data.schedule !== undefined) row.schedule = data.schedule;
    if (data.orchestrator !== undefined) row.orchestrator = data.orchestrator;
    if (data.status !== undefined) row.status = data.status;
    if (data.lastRun !== undefined) row.last_run = data.lastRun;
    if (data.documentationUrl !== undefined) row.documentation_url = data.documentationUrl;
    if (data.notes !== undefined) row.notes = data.notes;

    return row;
  }

  /**
   * Create ETL process with client ID
   */
  async createForClient(clientId, data) {
    return this.create({ ...data, clientId });
  }

  /**
   * Find ETL processes by status
   */
  async findByStatus(status) {
    return this.findAll({ filters: { status } });
  }

  /**
   * Find ETL processes by orchestrator
   */
  async findByOrchestrator(orchestrator) {
    return this.findAll({ filters: { orchestrator } });
  }
}

export const etlRepository = new ETLRepository();
