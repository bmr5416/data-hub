/**
 * Form option constants for entity creation forms
 * Used by SourceForm, ETLForm, KPIForm
 */

export const SOURCE_TYPES = [
  'warehouse',
  'analytics',
  'crm',
  'cdp',
  'advertising',
  'ecommerce',
  'email',
  'attribution',
  'other',
];

export const CONNECTION_METHODS = [
  'api',
  'manual_upload',
  'fivetran',
  'stitch',
  'airbyte',
  'custom_etl',
  'other',
];

export const REFRESH_FREQUENCIES = [
  'realtime',
  'hourly',
  'daily',
  'weekly',
  'manual',
];

export const SOURCE_STATUSES = [
  'connected',
  'pending',
  'error',
  'disconnected',
];

export const ETL_ORCHESTRATORS = [
  'airflow',
  'dbt',
  'prefect',
  'fivetran',
  'manual',
  'custom',
  'other',
];

export const ETL_STATUSES = [
  'active',
  'paused',
  'error',
  'deprecated',
];

export const KPI_CATEGORIES = [
  'acquisition',
  'engagement',
  'conversion',
  'retention',
  'revenue',
  'efficiency',
  'other',
];

export const KPI_FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annual',
];

export const REPORT_TYPES = [
  'dashboard',
  'scheduled_email',
  'ad_hoc',
  'automated',
  'other',
];

export const REPORT_FREQUENCIES = [
  'realtime',
  'daily',
  'weekly',
  'monthly',
  'on_demand',
];
