/**
 * ETL Service
 *
 * Database operations for ETL processes.
 */

import {
  getClient,
  generateId,
  mapRow,
  mapRows,
  handleQueryResult,
} from './BaseService.js';

// Field mapping: database column -> JS property
const ETL_FIELDS = {
  id: 'id',
  client_id: 'clientId',
  name: 'name',
  source_ids: 'sourceIds',
  destination: 'destination',
  transform_description: 'transformDescription',
  schedule: 'schedule',
  orchestrator: 'orchestrator',
  status: 'status',
  last_run: 'lastRun',
  documentation_url: 'documentationUrl',
  notes: 'notes',
};

/**
 * Map ETL row to JS object
 */
function mapETLRow(row) {
  return mapRow(row, ETL_FIELDS);
}

/**
 * Get all ETL processes
 */
export async function getAllETLProcesses() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('etl_processes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, ETL_FIELDS);
}

/**
 * Get ETL processes for a client
 */
export async function getClientETLProcesses(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('etl_processes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, ETL_FIELDS);
}

/**
 * Get single ETL process by ID
 */
export async function getETLProcess(etlId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('etl_processes')
    .select('*')
    .eq('id', etlId)
    .single();

  return handleQueryResult({ data, error }, {
    fieldMap: ETL_FIELDS,
    single: true,
  });
}

/**
 * Create a new ETL process
 */
export async function createETLProcess(clientId, data) {
  const supabase = getClient();
  const etlId = data.id || generateId('e');

  const { data: etl, error } = await supabase
    .from('etl_processes')
    .insert({
      id: etlId,
      client_id: clientId,
      name: data.name,
      source_ids: data.sourceIds || '',
      destination: data.destination || '',
      transform_description: data.transformDescription || '',
      schedule: data.schedule || '',
      orchestrator: data.orchestrator || 'manual',
      status: data.status || 'active',
      last_run: data.lastRun || null,
      documentation_url: data.documentationUrl || '',
      notes: data.notes || '',
    })
    .select()
    .single();

  if (error) throw error;
  return mapETLRow(etl);
}

/**
 * Update an ETL process
 */
export async function updateETLProcess(etlId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.sourceIds !== undefined) updateData.source_ids = data.sourceIds;
  if (data.destination !== undefined) updateData.destination = data.destination;
  if (data.transformDescription !== undefined) {
    updateData.transform_description = data.transformDescription;
  }
  if (data.schedule !== undefined) updateData.schedule = data.schedule;
  if (data.orchestrator) updateData.orchestrator = data.orchestrator;
  if (data.status) updateData.status = data.status;
  if (data.lastRun !== undefined) updateData.last_run = data.lastRun;
  if (data.documentationUrl !== undefined) {
    updateData.documentation_url = data.documentationUrl;
  }
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { data: etl, error } = await supabase
    .from('etl_processes')
    .update(updateData)
    .eq('id', etlId)
    .select()
    .single();

  return handleQueryResult({ data: etl, error }, {
    fieldMap: ETL_FIELDS,
    single: true,
  });
}

/**
 * Delete an ETL process
 */
export async function deleteETLProcess(etlId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('etl_processes')
    .delete()
    .eq('id', etlId);

  if (error) throw error;
  return true;
}
