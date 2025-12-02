/**
 * KPIRepository
 *
 * Data access layer for KPI operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';

class KPIRepository extends BaseRepository {
  constructor() {
    super('kpis', 'k');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      category: row.category,
      definition: row.definition,
      dataSources: row.data_sources,
      targetValue: row.target_value ? parseFloat(row.target_value) : row.target_value,
      reportingFrequency: row.reporting_frequency,
      dashboardLocation: row.dashboard_location,
      owner: row.owner,
      notes: row.notes,
      metric: row.metric,
      format: row.format,
      currentValue: row.current_value ? parseFloat(row.current_value) : row.current_value,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId) row.client_id = data.clientId;
    }

    if (data.name !== undefined) row.name = data.name;
    if (data.category !== undefined) row.category = data.category;
    if (data.definition !== undefined) row.definition = data.definition;
    if (data.dataSources !== undefined) row.data_sources = data.dataSources;
    if (data.targetValue !== undefined) row.target_value = data.targetValue;
    if (data.reportingFrequency !== undefined) row.reporting_frequency = data.reportingFrequency;
    if (data.dashboardLocation !== undefined) row.dashboard_location = data.dashboardLocation;
    if (data.owner !== undefined) row.owner = data.owner;
    if (data.notes !== undefined) row.notes = data.notes;
    if (data.metric !== undefined) row.metric = data.metric;
    if (data.format !== undefined) row.format = data.format;
    if (data.currentValue !== undefined) row.current_value = data.currentValue;

    return row;
  }

  /**
   * Create KPI with client ID
   */
  async createForClient(clientId, data) {
    return this.create({ ...data, clientId });
  }

  /**
   * Find KPIs by category
   */
  async findByCategory(category) {
    return this.findAll({ filters: { category } });
  }

  /**
   * Find KPIs by owner
   */
  async findByOwner(owner) {
    return this.findAll({ filters: { owner } });
  }
}

export const kpiRepository = new KPIRepository();
