/**
 * Report Database Service
 *
 * Database operations for reports (basic + enhanced).
 */

import {
  getClient,
  generateId,
  mapRow,
  mapRows,
  handleQueryResult,
} from './BaseService.js';

// Basic report field mapping
const REPORT_FIELDS = {
  id: 'id',
  client_id: 'clientId',
  name: 'name',
  type: 'type',
  tool: 'tool',
  frequency: 'frequency',
  recipients: 'recipients',
  data_sources: 'dataSources',
  kpi_ids: 'kpiIds',
  url: 'url',
  notes: 'notes',
};

/**
 * Map basic report row
 */
function mapReportRow(row) {
  return mapRow(row, REPORT_FIELDS);
}

/**
 * Map enhanced report row with additional fields
 */
function mapEnhancedReportRow(row) {
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
    deliveryFormat: row.delivery_format || 'view_only',
    isScheduled: row.is_scheduled || false,
    lastSentAt: row.last_sent_at,
    nextRunAt: row.next_run_at,
    sendCount: row.send_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all reports (basic)
 */
export async function getAllReports() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, REPORT_FIELDS);
}

/**
 * Get reports for a client (basic)
 */
export async function getClientReports(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, REPORT_FIELDS);
}

/**
 * Get single report by ID (basic)
 */
export async function getReport(reportId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  return handleQueryResult({ data, error }, {
    fieldMap: REPORT_FIELDS,
    single: true,
  });
}

/**
 * Create a basic report
 */
export async function createReport(clientId, data) {
  const supabase = getClient();
  const reportId = data.id || generateId('r');

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      id: reportId,
      client_id: clientId,
      name: data.name,
      type: data.type || 'dashboard',
      tool: data.tool || 'google_sheets',
      frequency: data.frequency || 'weekly',
      recipients: data.recipients || '',
      data_sources: data.dataSources || '',
      kpi_ids: data.kpiIds || '',
      url: data.url || '',
      notes: data.notes || '',
    })
    .select()
    .single();

  if (error) throw error;
  return mapReportRow(report);
}

/**
 * Update a basic report
 */
export async function updateReport(reportId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.type) updateData.type = data.type;
  if (data.tool) updateData.tool = data.tool;
  if (data.frequency) updateData.frequency = data.frequency;
  if (data.recipients !== undefined) updateData.recipients = data.recipients;
  if (data.dataSources !== undefined) updateData.data_sources = data.dataSources;
  if (data.kpiIds !== undefined) updateData.kpi_ids = data.kpiIds;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { data: report, error } = await supabase
    .from('reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  return handleQueryResult({ data: report, error }, {
    fieldMap: REPORT_FIELDS,
    single: true,
  });
}

/**
 * Delete a report
 */
export async function deleteReport(reportId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
  return true;
}

// ========== Enhanced Report Operations (Report Builder) ==========

/**
 * Create an enhanced report with visualization and schedule config
 */
export async function createEnhancedReport(clientId, data) {
  const supabase = getClient();
  const reportId = data.id || generateId('r');

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      id: reportId,
      client_id: clientId,
      name: data.name,
      type: data.type || 'builder',
      tool: data.tool || 'data_hub',
      frequency: data.frequency || 'on_demand',
      recipients: Array.isArray(data.recipients)
        ? data.recipients.join(',')
        : (data.recipients || ''),
      data_sources: data.dataSources || '',
      kpi_ids: data.kpiIds || '',
      url: data.url || '',
      notes: data.notes || '',
      warehouse_id: data.warehouseId || null,
      visualization_config: data.visualizationConfig || {},
      schedule_config: data.scheduleConfig || null,
      delivery_format: data.deliveryFormat || 'view_only',
      is_scheduled: data.isScheduled || false,
      next_run_at: data.nextRunAt || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapEnhancedReportRow(report);
}

/**
 * Update an enhanced report
 */
export async function updateEnhancedReport(reportId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.type) updateData.type = data.type;
  if (data.tool) updateData.tool = data.tool;
  if (data.frequency) updateData.frequency = data.frequency;
  if (data.recipients !== undefined) {
    updateData.recipients = Array.isArray(data.recipients)
      ? data.recipients.join(',')
      : data.recipients;
  }
  if (data.dataSources !== undefined) updateData.data_sources = data.dataSources;
  if (data.kpiIds !== undefined) updateData.kpi_ids = data.kpiIds;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.warehouseId !== undefined) updateData.warehouse_id = data.warehouseId;
  if (data.visualizationConfig !== undefined) {
    updateData.visualization_config = data.visualizationConfig;
  }
  if (data.scheduleConfig !== undefined) updateData.schedule_config = data.scheduleConfig;
  if (data.deliveryFormat !== undefined) updateData.delivery_format = data.deliveryFormat;
  if (data.isScheduled !== undefined) updateData.is_scheduled = data.isScheduled;
  if (data.lastSentAt !== undefined) updateData.last_sent_at = data.lastSentAt;
  if (data.nextRunAt !== undefined) updateData.next_run_at = data.nextRunAt;
  if (data.sendCount !== undefined) updateData.send_count = data.sendCount;

  const { data: report, error } = await supabase
    .from('reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapEnhancedReportRow(report);
}

/**
 * Get enhanced report by ID
 */
export async function getEnhancedReport(reportId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapEnhancedReportRow(data);
}

/**
 * Get scheduled reports that are due to run
 */
export async function getScheduledReportsDue() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('is_scheduled', true)
    .lte('next_run_at', new Date().toISOString())
    .order('next_run_at', { ascending: true });

  if (error) throw error;
  return data.map(mapEnhancedReportRow);
}
