/**
 * KPI Service
 *
 * Database operations for KPIs.
 */

import {
  getClient,
  generateId,
  mapRow,
  mapRows,
  handleQueryResult,
} from './BaseService.js';

// Field mapping: database column -> JS property
const KPI_FIELDS = {
  id: 'id',
  client_id: 'clientId',
  name: 'name',
  category: 'category',
  definition: 'definition',
  data_sources: 'dataSources',
  target_value: 'targetValue',
  reporting_frequency: 'reportingFrequency',
  dashboard_location: 'dashboardLocation',
  owner: 'owner',
  notes: 'notes',
};

/**
 * Map KPI row to JS object
 */
function mapKPIRow(row) {
  return mapRow(row, KPI_FIELDS);
}

/**
 * Get all KPIs
 */
export async function getAllKPIs() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('kpis')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, KPI_FIELDS);
}

/**
 * Get KPIs for a client
 */
export async function getClientKPIs(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('kpis')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, KPI_FIELDS);
}

/**
 * Get single KPI by ID
 */
export async function getKPI(kpiId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('kpis')
    .select('*')
    .eq('id', kpiId)
    .single();

  return handleQueryResult({ data, error }, {
    fieldMap: KPI_FIELDS,
    single: true,
  });
}

/**
 * Create a new KPI
 */
export async function createKPI(clientId, data) {
  const supabase = getClient();
  const kpiId = data.id || generateId('k');

  const { data: kpi, error } = await supabase
    .from('kpis')
    .insert({
      id: kpiId,
      client_id: clientId,
      name: data.name,
      category: data.category || 'other',
      definition: data.definition || '',
      data_sources: data.dataSources || '',
      target_value: data.targetValue || '',
      reporting_frequency: data.reportingFrequency || 'monthly',
      dashboard_location: data.dashboardLocation || '',
      owner: data.owner || '',
      notes: data.notes || '',
    })
    .select()
    .single();

  if (error) throw error;
  return mapKPIRow(kpi);
}

/**
 * Update a KPI
 */
export async function updateKPI(kpiId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.category) updateData.category = data.category;
  if (data.definition !== undefined) updateData.definition = data.definition;
  if (data.dataSources !== undefined) updateData.data_sources = data.dataSources;
  if (data.targetValue !== undefined) updateData.target_value = data.targetValue;
  if (data.reportingFrequency) updateData.reporting_frequency = data.reportingFrequency;
  if (data.dashboardLocation !== undefined) {
    updateData.dashboard_location = data.dashboardLocation;
  }
  if (data.owner !== undefined) updateData.owner = data.owner;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { data: kpi, error } = await supabase
    .from('kpis')
    .update(updateData)
    .eq('id', kpiId)
    .select()
    .single();

  return handleQueryResult({ data: kpi, error }, {
    fieldMap: KPI_FIELDS,
    single: true,
  });
}

/**
 * Delete a KPI
 */
export async function deleteKPI(kpiId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('kpis')
    .delete()
    .eq('id', kpiId);

  if (error) throw error;
  return true;
}
