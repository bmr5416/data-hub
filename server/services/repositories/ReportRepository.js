/**
 * ReportRepository
 *
 * Data access layer for report operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';

class ReportRepository extends BaseRepository {
  constructor() {
    super('reports', 'r');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      type: row.type,
      tool: row.tool,
      frequency: row.frequency,
      recipients: row.recipients ? row.recipients.split(',').filter(Boolean) : [],
      dataSources: row.data_sources,
      kpiIds: row.kpi_ids,
      url: row.url,
      notes: row.notes,
      warehouseId: row.warehouse_id,
      visualizationConfig: row.visualization_config || {},
      scheduleConfig: row.schedule_config,
      format: row.delivery_format,
      isScheduled: row.is_scheduled,
      lastSentAt: row.last_sent_at,
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
    if (data.type !== undefined) row.type = data.type;
    if (data.tool !== undefined) row.tool = data.tool;
    if (data.frequency !== undefined) row.frequency = data.frequency;
    if (data.recipients !== undefined) {
      row.recipients = Array.isArray(data.recipients)
        ? data.recipients.join(',')
        : (data.recipients || '');
    }
    if (data.dataSources !== undefined) row.data_sources = data.dataSources;
    if (data.kpiIds !== undefined) row.kpi_ids = data.kpiIds;
    if (data.url !== undefined) row.url = data.url;
    if (data.notes !== undefined) row.notes = data.notes;
    if (data.warehouseId !== undefined) row.warehouse_id = data.warehouseId;
    if (data.visualizationConfig !== undefined) row.visualization_config = data.visualizationConfig;
    if (data.scheduleConfig !== undefined) row.schedule_config = data.scheduleConfig;
    if (data.format !== undefined) row.delivery_format = data.format;
    if (data.isScheduled !== undefined) row.is_scheduled = data.isScheduled;
    if (data.lastSentAt !== undefined) row.last_sent_at = data.lastSentAt;

    return row;
  }

  /**
   * Create report with client ID
   */
  async createForClient(clientId, data) {
    return this.create({ ...data, clientId });
  }

  /**
   * Find reports by type
   */
  async findByType(type) {
    return this.findAll({ filters: { type } });
  }

  /**
   * Find scheduled reports
   */
  async findScheduled() {
    return this.findAll({ filters: { is_scheduled: true } });
  }

  /**
   * Find reports by warehouse
   */
  async findByWarehouseId(warehouseId) {
    return this.findAll({ filters: { warehouse_id: warehouseId } });
  }

  /**
   * Update last sent timestamp
   */
  async updateLastSent(reportId) {
    return this.update(reportId, { lastSentAt: new Date().toISOString() });
  }

  /**
   * Find scheduled reports that are due for delivery
   *
   * A report is "due" if:
   * - is_scheduled = true
   * - Either never sent (last_sent_at IS NULL) OR last_sent_at is older than the schedule interval
   *
   * This is a backup mechanism for the cron scheduler - it catches any missed deliveries.
   */
  async findScheduledDue() {
    // Use findScheduled to get all scheduled reports, then filter
    const scheduledReports = await this.findScheduled();

    // Filter to reports that are due based on their schedule
    const now = new Date();
    return scheduledReports.filter((report) => {
      const scheduleConfig = report.scheduleConfig;
      if (!scheduleConfig) return false;

      const lastSent = report.lastSentAt ? new Date(report.lastSentAt) : null;

      // If never sent, it's due
      if (!lastSent) return true;

      // Calculate if enough time has passed based on frequency
      const frequency = scheduleConfig.frequency || 'daily';
      const msSinceLastSent = now.getTime() - lastSent.getTime();

      switch (frequency) {
        case 'daily':
          return msSinceLastSent >= 24 * 60 * 60 * 1000; // 24 hours
        case 'weekly':
          return msSinceLastSent >= 7 * 24 * 60 * 60 * 1000; // 7 days
        case 'monthly':
          return msSinceLastSent >= 30 * 24 * 60 * 60 * 1000; // 30 days
        case 'hourly':
          return msSinceLastSent >= 60 * 60 * 1000; // 1 hour
        default:
          return msSinceLastSent >= 24 * 60 * 60 * 1000; // Default to daily
      }
    });
  }
}

export const reportRepository = new ReportRepository();
