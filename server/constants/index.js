/**
 * Shared Constants
 *
 * Centralized constants for validation and business rules.
 * Import from here instead of defining locally in routes.
 */

// ============ VALIDATION PATTERNS ============

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============ PLATFORM DEFINITIONS ============

export const PLATFORMS = [
  // Analytics
  'ga4',
  'amplitude',
  'mixpanel',

  // Advertising - Meta/Social
  'meta_ads',
  'tiktok',
  'pinterest',
  'linkedin',
  'twitter',

  // Advertising - Search
  'google_ads',
  'bing_ads',

  // Advertising - Programmatic
  'dv360',
  'cm360',
  'sa360',
  'criteo',
  'amazon_ads',

  // E-commerce
  'shopify',

  // Email/SMS Marketing
  'klaviyo',
  'braze',
  'iterable',
  'attentive',
  'postscript',

  // Attribution
  'triple_whale',
  'northbeam',
  'rockerbox',
  'appsflyer',
  'branch',
  'adjust',

  // CRM
  'salesforce',
  'hubspot',

  // Support
  'gorgias',
  'zendesk',

  // Payments
  'stripe',
  'recurly',
  'recharge',

  // Data Infrastructure
  'segment',
  'snowflake',
  'bigquery',
  'redshift',

  // Catch-all
  'other',
];

// ============ CLIENT CONSTANTS ============

export const CLIENT_STATUSES = ['active', 'inactive', 'onboarding'];

export const INDUSTRIES = [
  'E-commerce',
  'SaaS',
  'Healthcare',
  'Finance',
  'Education',
  'Media',
  'Travel',
  'Retail',
  'Technology',
  'Other',
];

// ============ SOURCE CONSTANTS ============

export const SOURCE_STATUSES = ['connected', 'pending', 'error', 'disconnected'];

export const SOURCE_TYPES = [
  'warehouse',
  'analytics',
  'crm',
  'cdp',
  'advertising',
  'ecommerce',
  'email',
  'attribution',
  'support',
  'payments',
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

export const REFRESH_FREQUENCIES = ['realtime', 'hourly', 'daily', 'weekly', 'manual'];

// ============ ETL CONSTANTS ============

export const ETL_STATUSES = ['active', 'paused', 'error', 'deprecated'];

export const ORCHESTRATORS = [
  'airflow',
  'dbt',
  'prefect',
  'fivetran',
  'manual',
  'custom',
  'other',
];

// ============ KPI CONSTANTS ============

export const KPI_CATEGORIES = [
  'acquisition',
  'engagement',
  'conversion',
  'retention',
  'revenue',
  'efficiency',
  'other',
];

export const KPI_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];

// ============ REPORT CONSTANTS ============

export const REPORT_TYPES = [
  'dashboard',
  'scheduled_email',
  'ad_hoc',
  'automated',
  'builder',
  'other',
];

export const REPORT_TOOLS = [
  'looker',
  'tableau',
  'powerbi',
  'google_sheets',
  'data_studio',
  'data_hub',
  'custom',
  'other',
];

export const REPORT_FREQUENCIES = ['realtime', 'daily', 'weekly', 'monthly', 'on_demand'];

export const DELIVERY_FORMATS = ['pdf', 'csv', 'view_only'];

// ============ LINEAGE CONSTANTS ============

export const DESTINATION_TYPES = ['etl', 'kpi', 'report'];

// ============ NOTES CONSTANTS ============

export const ENTITY_TYPES = ['source', 'etl', 'kpi', 'report', 'client'];

// ============ ALERT CONSTANTS ============

export const ALERT_CONDITIONS = [
  'above_threshold',
  'below_threshold',
  'equals',
  'percent_change',
];

export const ALERT_TYPES = ['metric_threshold', 'trend_detection', 'data_freshness'];

export const ALERT_CHANNELS = ['email', 'slack', 'webhook'];

// ============ USER CONSTANTS ============

export const USER_ROLES = ['admin', 'editor', 'viewer'];

// ============ UTILITY FUNCTIONS ============

/**
 * Check if a value is in an allowed list
 * @param {*} value - Value to check
 * @param {Array} allowed - Allowed values
 * @returns {boolean}
 */
export function isValidValue(value, allowed) {
  return allowed.includes(value);
}

/**
 * Get validation message for invalid enum value
 * @param {string} field - Field name
 * @param {Array} allowed - Allowed values
 * @returns {string}
 */
export function getEnumError(field, allowed) {
  return `${field} must be one of: ${allowed.join(', ')}`;
}
