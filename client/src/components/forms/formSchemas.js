/**
 * Form Schemas for Schema-Driven Forms
 *
 * Defines field structure for entity forms.
 * Used by DynamicEntityForm to render consistent form UIs.
 */

import {
  SOURCE_TYPES,
  CONNECTION_METHODS,
  REFRESH_FREQUENCIES,
  SOURCE_STATUSES,
  ETL_ORCHESTRATORS,
  ETL_STATUSES,
  KPI_CATEGORIES,
  KPI_FREQUENCIES,
  REPORT_TYPES,
  REPORT_FREQUENCIES,
} from '../../data/formConstants';

/**
 * Field type definitions:
 * - text: Standard text input
 * - email: Email input with validation
 * - url: URL input
 * - select: Dropdown with options array
 * - textarea: Multi-line text input
 */

export const SOURCE_SCHEMA = {
  title: 'Add Data Source',
  submitLabel: 'Add Source',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., GA4 - Website',
    },
    {
      name: 'platform',
      label: 'Platform',
      type: 'platform-select', // Special type - receives platforms prop
      default: 'custom',
    },
    {
      name: 'sourceType',
      label: 'Source Type',
      type: 'select',
      options: SOURCE_TYPES,
      default: 'other',
    },
    {
      name: 'connectionMethod',
      label: 'Connection Method',
      type: 'select',
      options: CONNECTION_METHODS,
      default: 'api',
      formatOption: 'underscore', // Replace underscores with spaces
    },
    {
      name: 'refreshFrequency',
      label: 'Refresh Frequency',
      type: 'select',
      options: REFRESH_FREQUENCIES,
      default: 'daily',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: SOURCE_STATUSES,
      default: 'pending',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes...',
      rows: 3,
    },
  ],
};

export const ETL_SCHEMA = {
  title: 'Add ETL Process',
  submitLabel: 'Add ETL Process',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Daily Meta CAPI Sync',
    },
    {
      name: 'destination',
      label: 'Destination',
      type: 'text',
      placeholder: 'e.g., Snowflake warehouse',
    },
    {
      name: 'orchestrator',
      label: 'Orchestrator',
      type: 'select',
      options: ETL_ORCHESTRATORS,
      default: 'manual',
    },
    {
      name: 'schedule',
      label: 'Schedule',
      type: 'text',
      placeholder: 'e.g., Daily at 6 AM',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: ETL_STATUSES,
      default: 'active',
    },
    {
      name: 'transformDescription',
      label: 'Transformation Description',
      type: 'textarea',
      placeholder: 'Describe the data transformations...',
      rows: 3,
    },
    {
      name: 'notes',
      label: 'Internal Notes',
      type: 'textarea',
      placeholder: 'Add internal documentation or context...',
      rows: 2,
    },
  ],
};

export const KPI_SCHEMA = {
  title: 'Add KPI',
  submitLabel: 'Add KPI',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Monthly ROAS',
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: KPI_CATEGORIES,
      default: 'revenue',
    },
    {
      name: 'definition',
      label: 'Definition',
      type: 'textarea',
      placeholder: 'How is this KPI calculated?',
      rows: 3,
    },
    {
      name: 'targetValue',
      label: 'Target Value',
      type: 'text',
      placeholder: 'e.g., 4.0x',
    },
    {
      name: 'reportingFrequency',
      label: 'Reporting Frequency',
      type: 'select',
      options: KPI_FREQUENCIES,
      default: 'monthly',
    },
    {
      name: 'owner',
      label: 'Owner',
      type: 'text',
      placeholder: 'e.g., Marketing Team',
    },
    {
      name: 'notes',
      label: 'Internal Notes',
      type: 'textarea',
      placeholder: 'Add internal documentation or context...',
      rows: 2,
    },
  ],
};

export const REPORT_SCHEMA = {
  title: 'Add Report',
  submitLabel: 'Add Report',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Weekly Performance Dashboard',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: REPORT_TYPES,
      default: 'dashboard',
      formatOption: 'underscore',
    },
    {
      name: 'frequency',
      label: 'Frequency',
      type: 'select',
      options: REPORT_FREQUENCIES,
      default: 'weekly',
      formatOption: 'underscore',
    },
    {
      name: 'recipients',
      label: 'Recipients',
      type: 'text',
      placeholder: 'e.g., team@company.com',
    },
    {
      name: 'url',
      label: 'Report URL',
      type: 'url',
      placeholder: 'https://...',
    },
    {
      name: 'notes',
      label: 'Internal Notes',
      type: 'textarea',
      placeholder: 'Add internal documentation or context...',
      rows: 2,
    },
  ],
};
