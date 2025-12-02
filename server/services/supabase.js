/**
 * Supabase Service Facade
 *
 * Thin facade that delegates to domain repositories for backwards compatibility.
 * Routes and services can continue using supabaseService while we migrate to repositories.
 *
 * @deprecated New code should import from repositories directly:
 *   import { clientRepository, sourceRepository } from './repositories/index.js';
 */

import { supabase } from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

// Import domain repositories
import {
  clientRepository,
  sourceRepository,
  etlRepository,
  kpiRepository,
  reportRepository,
  warehouseRepository,
  lineageRepository,
  uploadRepository,
  alertRepository,
  scheduledJobRepository,
  settingsRepository,
  noteRepository,
  mappingRepository,
  kpiAlertRepository,
  deliveryHistoryRepository,
  smtpConfigRepository,
  platformDataRepository,
  blendedDataRepository,
} from './repositories/index.js';

/**
 * Supabase Service
 *
 * Maintains identical API contracts for seamless frontend compatibility.
 */
class SupabaseService {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    if (!supabase) {
      throw new Error('Supabase client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    this.initialized = true;
  }

  // ========== CLIENT OPERATIONS ==========
  // @deprecated Use clientRepository directly

  async getClients() {
    return clientRepository.findAllWithCounts();
  }

  async getCountsByClientId(table, clientIds) {
    if (clientIds.length === 0) return {};

    const { data, error } = await supabase
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

  async getClient(clientId) {
    return clientRepository.findByIdWithRelations(clientId);
  }

  async createClient(data) {
    return clientRepository.create(data);
  }

  async updateClient(clientId, data) {
    return clientRepository.update(clientId, data);
  }

  async deleteClient(clientId) {
    return clientRepository.delete(clientId);
  }

  // ========== DATA SOURCE OPERATIONS ==========
  // @deprecated Use sourceRepository directly

  async getAllSources() {
    return sourceRepository.findAll();
  }

  async getClientSources(clientId) {
    return sourceRepository.findByClientId(clientId);
  }

  async getSource(sourceId) {
    return sourceRepository.findById(sourceId);
  }

  async createSource(clientId, data) {
    return sourceRepository.createForClient(clientId, data);
  }

  async updateSource(sourceId, data) {
    return sourceRepository.update(sourceId, data);
  }

  async deleteSource(sourceId) {
    return sourceRepository.delete(sourceId);
  }

  // Kept for internal use by clientRepository
  mapSourceRow(row) {
    return sourceRepository.mapRow(row);
  }

  // ========== ETL PROCESS OPERATIONS ==========
  // @deprecated Use etlRepository directly

  async getAllETLProcesses() {
    return etlRepository.findAll();
  }

  async getClientETLProcesses(clientId) {
    return etlRepository.findByClientId(clientId);
  }

  async getETLProcess(etlId) {
    return etlRepository.findById(etlId);
  }

  async createETLProcess(clientId, data) {
    return etlRepository.createForClient(clientId, data);
  }

  async updateETLProcess(etlId, data) {
    return etlRepository.update(etlId, data);
  }

  async deleteETLProcess(etlId) {
    return etlRepository.delete(etlId);
  }

  mapETLRow(row) {
    return etlRepository.mapRow(row);
  }

  // ========== KPI OPERATIONS ==========
  // @deprecated Use kpiRepository directly

  async getAllKPIs() {
    return kpiRepository.findAll();
  }

  async getClientKPIs(clientId) {
    return kpiRepository.findByClientId(clientId);
  }

  async getKPI(kpiId) {
    return kpiRepository.findById(kpiId);
  }

  async createKPI(clientId, data) {
    return kpiRepository.createForClient(clientId, data);
  }

  async updateKPI(kpiId, data) {
    return kpiRepository.update(kpiId, data);
  }

  async deleteKPI(kpiId) {
    return kpiRepository.delete(kpiId);
  }

  mapKPIRow(row) {
    return kpiRepository.mapRow(row);
  }

  // ========== REPORT OPERATIONS ==========
  // @deprecated Use reportRepository directly

  async getAllReports() {
    return reportRepository.findAll();
  }

  async getClientReports(clientId) {
    return reportRepository.findByClientId(clientId);
  }

  async getReport(reportId) {
    return reportRepository.findById(reportId);
  }

  async createReport(clientId, data) {
    return reportRepository.createForClient(clientId, data);
  }

  async updateReport(reportId, data) {
    return reportRepository.update(reportId, data);
  }

  async deleteReport(reportId) {
    return reportRepository.delete(reportId);
  }

  mapReportRow(row) {
    return reportRepository.mapRow(row);
  }

  // ========== DATA LINEAGE OPERATIONS ==========
  // @deprecated Use lineageRepository directly

  async getClientLineage(clientId) {
    return lineageRepository.findByClientId(clientId);
  }

  async getLineage(lineageId) {
    return lineageRepository.findById(lineageId);
  }

  async createLineage(data) {
    return lineageRepository.create(data);
  }

  async deleteLineage(lineageId) {
    return lineageRepository.delete(lineageId);
  }

  // ========== NOTES OPERATIONS ==========
  // @deprecated Use noteRepository directly

  /**
   * @deprecated Use noteRepository.findByEntity() instead
   */
  async getNotes(entityType, entityId) {
    return noteRepository.findByEntity(entityType, entityId);
  }

  /**
   * @deprecated Use noteRepository.upsertByEntity() instead
   */
  async saveNote(entityType, entityId, data) {
    return noteRepository.upsertByEntity(entityType, entityId, data);
  }

  /**
   * @deprecated Use noteRepository.deleteByEntity() instead
   */
  async deleteNote(entityType, entityId) {
    return noteRepository.deleteByEntity(entityType, entityId);
  }

  // ========== DATA WAREHOUSES OPERATIONS ==========
  // @deprecated Use warehouseRepository directly

  async getClientWarehouses(clientId) {
    return warehouseRepository.findByClientId(clientId);
  }

  async createWarehouse(clientId, data) {
    return warehouseRepository.createForClient(clientId, data);
  }

  async getWarehouseById(warehouseId) {
    return warehouseRepository.findById(warehouseId);
  }

  async updateWarehouse(warehouseId, data) {
    return warehouseRepository.update(warehouseId, data);
  }

  // ========== PLATFORM UPLOAD OPERATIONS ==========
  // @deprecated Use uploadRepository directly

  async getClientUploads(clientId, platformId = null) {
    if (platformId) {
      return uploadRepository.findByPlatformId(clientId, platformId);
    }
    return uploadRepository.findByWarehouseId(clientId);
  }

  async getUpload(uploadId) {
    return uploadRepository.findById(uploadId);
  }

  async createUpload(clientId, data) {
    await this.init();

    const uploadId = `up-${uuidv4().slice(0, 8)}`;

    const { data: upload, error } = await supabase
      .from('platform_uploads')
      .insert({
        id: uploadId,
        client_id: clientId,
        platform_id: data.platformId,
        filename: data.filename,
        original_filename: data.originalFilename,
        file_size: data.fileSize || 0,
        row_count: data.rowCount || 0,
        column_headers: data.columnHeaders || [],
        status: data.status || 'pending',
        metadata: data.metadata || null,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapUploadRow(upload);
  }

  async updateUpload(uploadId, data) {
    return uploadRepository.update(uploadId, data);
  }

  async deleteUpload(uploadId) {
    return uploadRepository.delete(uploadId);
  }

  async deleteUploadsByPlatform(clientId, platformId) {
    return uploadRepository.deleteByPlatform(clientId, platformId);
  }

  mapUploadRow(row) {
    return {
      id: row.id,
      clientId: row.client_id,
      platformId: row.platform_id,
      filename: row.filename,
      originalFilename: row.original_filename,
      fileSize: row.file_size,
      rowCount: row.row_count,
      columnHeaders: row.column_headers || [],
      status: row.status,
      errorMessage: row.error_message,
      metadata: row.metadata,
      uploadedAt: row.uploaded_at,
    };
  }

  // ========== PLATFORM DATA OPERATIONS ==========
  // @deprecated Use platformDataRepository directly

  /**
   * @deprecated Use platformDataRepository.findByClientId() instead
   */
  async getPlatformData(clientId, platformId = null, uploadId = null, options = {}) {
    return platformDataRepository.findByClientId(clientId, platformId, uploadId, options);
  }

  /**
   * @deprecated Use platformDataRepository.countByClientId() instead
   */
  async countPlatformDataRows(clientId, platformIds = null) {
    return platformDataRepository.countByClientId(clientId, platformIds);
  }

  /**
   * @deprecated Use platformDataRepository.getLatestUploadDate() instead
   */
  async getLatestUploadDate(clientId, platformIds = null) {
    return platformDataRepository.getLatestUploadDate(clientId, platformIds);
  }

  /**
   * @deprecated Use platformDataRepository.findByDateRange() instead
   */
  async getPlatformDataByDateRange(clientId, platformId = null, startDate, endDate, dateField = 'date', options = {}) {
    return platformDataRepository.findByDateRange(clientId, platformId, startDate, endDate, dateField, options);
  }

  /**
   * @deprecated Use platformDataRepository.bulkInsert() instead
   */
  async insertPlatformData(uploadId, clientId, platformId, rows) {
    return platformDataRepository.bulkInsert(uploadId, clientId, platformId, rows);
  }

  /**
   * @deprecated Use platformDataRepository.deleteByClient() instead
   */
  async deletePlatformData(clientId, platformId = null, uploadId = null) {
    return platformDataRepository.deleteByClient(clientId, platformId, uploadId);
  }

  // ========== BLENDED DATA OPERATIONS ==========
  // @deprecated Use blendedDataRepository directly

  /**
   * @deprecated Use blendedDataRepository.findByClientId() instead
   */
  async getBlendedData(clientId, batchId = null) {
    return blendedDataRepository.findByClientId(clientId, batchId);
  }

  /**
   * @deprecated Use blendedDataRepository.bulkInsert() instead
   */
  async insertBlendedData(clientId, batchId, rows, sourcePlatforms) {
    return blendedDataRepository.bulkInsert(clientId, batchId, rows, sourcePlatforms);
  }

  /**
   * @deprecated Use blendedDataRepository.deleteByClient() instead
   */
  async deleteBlendedData(clientId, batchId = null) {
    return blendedDataRepository.deleteByClient(clientId, batchId);
  }

  /**
   * @deprecated Use blendedDataRepository.getLatestBatch() instead
   */
  async getLatestBlendBatch(clientId) {
    return blendedDataRepository.getLatestBatch(clientId);
  }

  // ========== SETTINGS OPERATIONS ==========
  // @deprecated Use settingsRepository directly

  /**
   * @deprecated Use settingsRepository.getValue() instead
   */
  async getSetting(key) {
    return settingsRepository.getValue(key);
  }

  /**
   * @deprecated Use settingsRepository.setValue() instead
   */
  async setSetting(key, value) {
    return settingsRepository.setValue(key, value);
  }

  // ========== KPI ALERTS OPERATIONS ==========
  // @deprecated Use kpiAlertRepository directly (separate from report alerts)

  /**
   * @deprecated Use kpiAlertRepository.findByKpiId() or findActive() instead
   */
  async getKPIAlerts(kpiId = null) {
    if (kpiId) {
      return kpiAlertRepository.findByKpiId(kpiId);
    }
    return kpiAlertRepository.findActive();
  }

  /**
   * @deprecated Use kpiAlertRepository.create() instead
   */
  async createKPIAlert(data) {
    return kpiAlertRepository.create(data);
  }

  /**
   * @deprecated Use kpiAlertRepository.update() instead
   */
  async updateKPIAlert(alertId, data) {
    return kpiAlertRepository.update(alertId, data);
  }

  /**
   * @deprecated Use kpiAlertRepository.delete() instead
   */
  async deleteKPIAlert(alertId) {
    return kpiAlertRepository.delete(alertId);
  }

  // ========== ALERT HISTORY OPERATIONS ==========

  async getAlertHistory(alertId = null, limit = 100) {
    await this.init();

    let query = supabase
      .from('alert_history')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (alertId) {
      query = query.eq('alert_id', alertId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      alertId: row.alert_id,
      kpiId: row.kpi_id,
      actualValue: parseFloat(row.actual_value),
      threshold: parseFloat(row.threshold),
      message: row.message,
      triggeredAt: row.triggered_at,
    }));
  }

  async createAlertHistory(data) {
    await this.init();

    const historyId = `ah-${uuidv4().slice(0, 8)}`;

    const { data: history, error } = await supabase
      .from('alert_history')
      .insert({
        id: historyId,
        alert_id: data.alertId,
        kpi_id: data.kpiId,
        actual_value: data.actualValue,
        threshold: data.threshold,
        message: data.message,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: history.id,
      alertId: history.alert_id,
      kpiId: history.kpi_id,
      actualValue: parseFloat(history.actual_value),
      threshold: parseFloat(history.threshold),
      message: history.message,
      triggeredAt: history.triggered_at,
    };
  }

  // ========== PLATFORM MAPPINGS OPERATIONS ==========
  // @deprecated Use mappingRepository directly

  /**
   * @deprecated Use mappingRepository.findByClientId() or findByClientAndPlatform() instead
   */
  async getClientPlatformMappings(clientId, platformId = null) {
    if (platformId) {
      return mappingRepository.findByClientAndPlatform(clientId, platformId);
    }
    return mappingRepository.findByClientId(clientId);
  }

  /**
   * @deprecated Use mappingRepository.findById() instead
   */
  async getPlatformMapping(mappingId) {
    return mappingRepository.findById(mappingId);
  }

  /**
   * @deprecated Use mappingRepository.create() instead
   */
  async createPlatformMapping(data) {
    return mappingRepository.create(data);
  }

  /**
   * @deprecated Use mappingRepository.update() instead
   */
  async updatePlatformMapping(mappingId, data) {
    return mappingRepository.update(mappingId, data);
  }

  /**
   * @deprecated Use mappingRepository.delete() instead
   */
  async deletePlatformMapping(mappingId) {
    return mappingRepository.delete(mappingId);
  }

  // ========== ENHANCED REPORT OPERATIONS (Report Builder) ==========
  // @deprecated Use reportRepository directly

  async createEnhancedReport(clientId, data) {
    return reportRepository.createForClient(clientId, data);
  }

  async updateEnhancedReport(reportId, data) {
    return reportRepository.update(reportId, data);
  }

  async getEnhancedReport(reportId) {
    return reportRepository.findById(reportId);
  }

  async getScheduledReportsDue() {
    return reportRepository.findScheduledDue();
  }

  mapEnhancedReportRow(row) {
    return reportRepository.mapRow(row);
  }

  // ========== SMTP CONFIG OPERATIONS ==========
  // @deprecated Use smtpConfigRepository directly

  /**
   * @deprecated Use smtpConfigRepository.findAll() instead
   */
  async getSmtpConfigs() {
    return smtpConfigRepository.findAll();
  }

  /**
   * @deprecated Use smtpConfigRepository.findById() instead
   */
  async getSmtpConfig(configId) {
    return smtpConfigRepository.findById(configId);
  }

  /**
   * @deprecated Use smtpConfigRepository.findDefault() instead
   */
  async getDefaultSmtpConfig() {
    return smtpConfigRepository.findDefault();
  }

  /**
   * @deprecated Use smtpConfigRepository.create() instead
   */
  async createSmtpConfig(data) {
    return smtpConfigRepository.create(data);
  }

  /**
   * @deprecated Use smtpConfigRepository.update() instead
   */
  async updateSmtpConfig(configId, data) {
    return smtpConfigRepository.update(configId, data);
  }

  /**
   * @deprecated Use smtpConfigRepository.delete() instead
   */
  async deleteSmtpConfig(configId) {
    return smtpConfigRepository.delete(configId);
  }

  // ========== REPORT ALERTS OPERATIONS ==========
  // @deprecated Use alertRepository directly

  async getReportAlerts(reportId = null, activeOnly = false) {
    if (reportId) {
      if (activeOnly) {
        return alertRepository.findEnabledByReportId(reportId);
      }
      return alertRepository.findByReportId(reportId);
    }
    if (activeOnly) {
      return alertRepository.findEnabled();
    }
    return alertRepository.findAll();
  }

  async getReportAlert(alertId) {
    return alertRepository.findById(alertId);
  }

  async createReportAlert(data) {
    return alertRepository.create({
      reportId: data.reportId,
      name: data.name,
      type: data.alertType,
      config: data.config,
      isEnabled: data.active !== false,
    });
  }

  async updateReportAlert(alertId, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.alertType !== undefined) updateData.type = data.alertType;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.active !== undefined) updateData.isEnabled = data.active;
    if (data.lastTriggeredAt !== undefined) updateData.lastTriggeredAt = data.lastTriggeredAt;

    return alertRepository.update(alertId, updateData);
  }

  async deleteReportAlert(alertId) {
    return alertRepository.delete(alertId);
  }

  mapReportAlertRow(row) {
    return alertRepository.mapRow(row);
  }

  // ========== REPORT ALERT HISTORY OPERATIONS ==========
  // @deprecated Use alertRepository.getHistory() directly

  async getReportAlertHistory(alertId = null, limit = 100) {
    if (alertId) {
      return alertRepository.getHistory(alertId, limit);
    }

    // Get history for all alerts
    await this.init();

    const { data, error } = await supabase
      .from('report_alert_history')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      alertId: row.alert_id,
      triggeredAt: row.triggered_at,
      details: row.details || {},
    }));
  }

  async createReportAlertHistory(data) {
    return alertRepository.recordTrigger(data.alertId, {
      reportId: data.reportId,
      alertType: data.alertType,
      actualValue: data.actualValue,
      thresholdValue: data.thresholdValue,
      message: data.message,
      metadata: data.metadata,
    });
  }

  // ========== SCHEDULED JOBS OPERATIONS ==========
  // @deprecated Use scheduledJobRepository directly

  async getScheduledJobs(_jobType = null, enabledOnly = true) {
    // Note: jobType filter not yet implemented in repository
    if (enabledOnly) {
      return scheduledJobRepository.findActive();
    }
    return scheduledJobRepository.findAll();
  }

  async getScheduledJob(jobId) {
    return scheduledJobRepository.findById(jobId);
  }

  async getScheduledJobByEntity(jobType, entityId) {
    return scheduledJobRepository.findByReportId(entityId);
  }

  async createScheduledJob(data) {
    return scheduledJobRepository.create({
      reportId: data.entityId,
      cronExpression: data.cronExpression,
      timezone: data.timezone || 'UTC',
      isActive: data.enabled !== false,
      nextRunAt: data.nextRunAt,
    });
  }

  async updateScheduledJob(jobId, data) {
    const updateData = {};
    if (data.cronExpression !== undefined) updateData.cronExpression = data.cronExpression;
    if (data.nextRunAt !== undefined) updateData.nextRunAt = data.nextRunAt;
    if (data.lastRunAt !== undefined) updateData.lastRunAt = data.lastRunAt;
    if (data.enabled !== undefined) updateData.isActive = data.enabled;

    return scheduledJobRepository.update(jobId, updateData);
  }

  async deleteScheduledJob(jobId) {
    return scheduledJobRepository.delete(jobId);
  }

  async deleteScheduledJobByEntity(jobType, entityId) {
    return scheduledJobRepository.deleteByReportId(entityId);
  }

  mapScheduledJobRow(row) {
    return scheduledJobRepository.mapRow(row);
  }

  // ========== REPORT DELIVERY HISTORY OPERATIONS ==========
  // @deprecated Use deliveryHistoryRepository directly

  /**
   * @deprecated Use deliveryHistoryRepository.findByReportId() or findAll() instead
   */
  async getReportDeliveryHistory(reportId = null, limit = 50) {
    if (reportId) {
      return deliveryHistoryRepository.findByReportId(reportId, limit);
    }
    return deliveryHistoryRepository.findAll(limit);
  }

  /**
   * @deprecated Use deliveryHistoryRepository.create() instead
   */
  async createReportDeliveryHistory(data) {
    return deliveryHistoryRepository.create(data);
  }

  /**
   * @deprecated Use deliveryHistoryRepository.update() instead
   */
  async updateReportDeliveryHistory(historyId, data) {
    return deliveryHistoryRepository.update(historyId, data);
  }
}

// Singleton instance
export const supabaseService = new SupabaseService();

export default supabaseService;
