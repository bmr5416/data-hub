/**
 * Source Service
 *
 * Database operations for data sources.
 */

import {
  getClient,
  generateId,
  mapRow,
  mapRows,
  handleQueryResult,
} from './BaseService.js';

// Field mapping: database column -> JS property
const SOURCE_FIELDS = {
  id: 'id',
  client_id: 'clientId',
  name: 'name',
  platform: 'platform',
  source_type: 'sourceType',
  connection_method: 'connectionMethod',
  refresh_frequency: 'refreshFrequency',
  status: 'status',
  credentials_location: 'credentialsLocation',
  notes: 'notes',
  created_at: 'createdAt',
};

/**
 * Map source row to JS object
 */
function mapSourceRow(row) {
  return mapRow(row, SOURCE_FIELDS);
}

/**
 * Get all sources
 */
export async function getAllSources() {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, SOURCE_FIELDS);
}

/**
 * Get sources for a client
 */
export async function getClientSources(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return mapRows(data, SOURCE_FIELDS);
}

/**
 * Get single source by ID
 */
export async function getSource(sourceId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('id', sourceId)
    .single();

  return handleQueryResult({ data, error }, {
    fieldMap: SOURCE_FIELDS,
    single: true,
  });
}

/**
 * Create a new source
 */
export async function createSource(clientId, data) {
  const supabase = getClient();
  const sourceId = data.id || generateId('s');

  const { data: source, error } = await supabase
    .from('data_sources')
    .insert({
      id: sourceId,
      client_id: clientId,
      name: data.name,
      platform: data.platform,
      source_type: data.sourceType || 'other',
      connection_method: data.connectionMethod || 'api',
      refresh_frequency: data.refreshFrequency || 'daily',
      status: data.status || 'pending',
      credentials_location: data.credentialsLocation || '',
      notes: data.notes || '',
    })
    .select()
    .single();

  if (error) throw error;
  return mapSourceRow(source);
}

/**
 * Update a source
 */
export async function updateSource(sourceId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.platform) updateData.platform = data.platform;
  if (data.sourceType) updateData.source_type = data.sourceType;
  if (data.connectionMethod) updateData.connection_method = data.connectionMethod;
  if (data.refreshFrequency) updateData.refresh_frequency = data.refreshFrequency;
  if (data.status) updateData.status = data.status;
  if (data.credentialsLocation !== undefined) {
    updateData.credentials_location = data.credentialsLocation;
  }
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { data: source, error } = await supabase
    .from('data_sources')
    .update(updateData)
    .eq('id', sourceId)
    .select()
    .single();

  return handleQueryResult({ data: source, error }, {
    fieldMap: SOURCE_FIELDS,
    single: true,
  });
}

/**
 * Delete a source
 */
export async function deleteSource(sourceId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('data_sources')
    .delete()
    .eq('id', sourceId);

  if (error) throw error;
  return true;
}
