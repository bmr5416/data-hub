/**
 * Database Services Index
 *
 * Central export point for all database operations.
 * Import from here to access any database functionality.
 *
 * Example usage:
 *   import { clientDb, sourceDb } from './services/database/index.js';
 *   const clients = await clientDb.getClients();
 *
 * Or import specific functions:
 *   import { getClients, getClient } from './services/database/ClientService.js';
 */

// Base utilities
export * from './BaseService.js';

// Domain services as namespaced exports
export * as clientDb from './ClientService.js';
export * as sourceDb from './SourceService.js';
export * as etlDb from './ETLService.js';
export * as kpiDb from './KPIService.js';
export * as reportDb from './ReportDbService.js';
export * as lineageDb from './LineageService.js';
export * as notesDb from './NotesService.js';
export * as warehouseDb from './WarehouseDbService.js';
export * as dataDb from './DataService.js';
export * as settingsDb from './SettingsService.js';
export * as alertDb from './AlertService.js';
export * as schedulerDb from './SchedulerDbService.js';
export * as mappingsDb from './MappingsService.js';

// Re-export individual functions for convenience
export {
  getClients,
  getClientById,
  getClientWithRelations,
  createClient,
  updateClient,
  deleteClient,
} from './ClientService.js';

export {
  getAllSources,
  getClientSources,
  getSource,
  createSource,
  updateSource,
  deleteSource,
} from './SourceService.js';

export {
  getAllETLProcesses,
  getClientETLProcesses,
  getETLProcess,
  createETLProcess,
  updateETLProcess,
  deleteETLProcess,
} from './ETLService.js';

export {
  getAllKPIs,
  getClientKPIs,
  getKPI,
  createKPI,
  updateKPI,
  deleteKPI,
} from './KPIService.js';

export {
  getAllReports,
  getClientReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  createEnhancedReport,
  updateEnhancedReport,
  getEnhancedReport,
  getScheduledReportsDue,
} from './ReportDbService.js';

export {
  getClientLineage,
  createLineage,
  deleteLineage,
} from './LineageService.js';

export {
  getNotes,
  saveNote,
  deleteNote,
} from './NotesService.js';

export {
  getClientWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from './WarehouseDbService.js';

export {
  getClientUploads,
  getUpload,
  createUpload,
  updateUpload,
  deleteUpload,
  deleteUploadsByPlatform,
  getPlatformData,
  getPlatformDataByDateRange,
  insertPlatformData,
  deletePlatformData,
  getBlendedData,
  insertBlendedData,
  deleteBlendedData,
  getLatestBlendBatch,
} from './DataService.js';

export {
  getSetting,
  setSetting,
  getSmtpConfigs,
  getSmtpConfig,
  getDefaultSmtpConfig,
  createSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
} from './SettingsService.js';

export {
  getKPIAlerts,
  createKPIAlert,
  updateKPIAlert,
  deleteKPIAlert,
  getAlertHistory,
  createAlertHistory,
  getReportAlerts,
  getReportAlert,
  createReportAlert,
  updateReportAlert,
  deleteReportAlert,
  getReportAlertHistory,
  createReportAlertHistory,
} from './AlertService.js';

export {
  getScheduledJobs,
  getScheduledJob,
  getScheduledJobByEntity,
  createScheduledJob,
  updateScheduledJob,
  deleteScheduledJob,
  deleteScheduledJobByEntity,
  getReportDeliveryHistory,
  createReportDeliveryHistory,
  updateReportDeliveryHistory,
} from './SchedulerDbService.js';

export {
  getClientPlatformMappings,
  createPlatformMapping,
  updatePlatformMapping,
  deletePlatformMapping,
} from './MappingsService.js';
