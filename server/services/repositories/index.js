/**
 * Repository Barrel Exports
 *
 * Central export point for all repository instances.
 */

// Base
export { BaseRepository } from '../base/BaseRepository.js';

// Domain repositories
export { clientRepository } from './ClientRepository.js';
export { sourceRepository } from './SourceRepository.js';
export { etlRepository } from './ETLRepository.js';
export { kpiRepository } from './KPIRepository.js';
export { reportRepository } from './ReportRepository.js';
export { warehouseRepository } from './WarehouseRepository.js';
export { lineageRepository } from './LineageRepository.js';
export { uploadRepository } from './UploadRepository.js';
export { alertRepository } from './AlertRepository.js';
export { scheduledJobRepository } from './ScheduledJobRepository.js';
export { settingsRepository } from './SettingsRepository.js';
export { noteRepository } from './NoteRepository.js';
export { mappingRepository } from './MappingRepository.js';
export { kpiAlertRepository } from './KpiAlertRepository.js';
export { deliveryHistoryRepository } from './DeliveryHistoryRepository.js';
export { smtpConfigRepository } from './SmtpConfigRepository.js';
export { platformDataRepository } from './PlatformDataRepository.js';
export { blendedDataRepository } from './BlendedDataRepository.js';

// Convenience object for dependency injection
export const repositories = {
  client: () => import('./ClientRepository.js').then((m) => m.clientRepository),
  source: () => import('./SourceRepository.js').then((m) => m.sourceRepository),
  etl: () => import('./ETLRepository.js').then((m) => m.etlRepository),
  kpi: () => import('./KPIRepository.js').then((m) => m.kpiRepository),
  report: () => import('./ReportRepository.js').then((m) => m.reportRepository),
  warehouse: () => import('./WarehouseRepository.js').then((m) => m.warehouseRepository),
  lineage: () => import('./LineageRepository.js').then((m) => m.lineageRepository),
  upload: () => import('./UploadRepository.js').then((m) => m.uploadRepository),
  alert: () => import('./AlertRepository.js').then((m) => m.alertRepository),
  scheduledJob: () => import('./ScheduledJobRepository.js').then((m) => m.scheduledJobRepository),
  settings: () => import('./SettingsRepository.js').then((m) => m.settingsRepository),
  note: () => import('./NoteRepository.js').then((m) => m.noteRepository),
  mapping: () => import('./MappingRepository.js').then((m) => m.mappingRepository),
  kpiAlert: () => import('./KpiAlertRepository.js').then((m) => m.kpiAlertRepository),
  deliveryHistory: () => import('./DeliveryHistoryRepository.js').then((m) => m.deliveryHistoryRepository),
  smtpConfig: () => import('./SmtpConfigRepository.js').then((m) => m.smtpConfigRepository),
  platformData: () => import('./PlatformDataRepository.js').then((m) => m.platformDataRepository),
  blendedData: () => import('./BlendedDataRepository.js').then((m) => m.blendedDataRepository),
};
