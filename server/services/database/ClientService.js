/**
 * Client Service
 *
 * Database operations for clients.
 */

import {
  getClient,
  generateId,
  mapRow,
  handleQueryResult,
  getCountsByClientId,
} from './BaseService.js';

// Field mapping: database column -> JS property
const CLIENT_FIELDS = {
  id: 'id',
  name: 'name',
  email: 'email',
  industry: 'industry',
  status: 'status',
  created_at: 'createdAt',
  notes: 'notes',
};

/**
 * Map client row to JS object
 */
function mapClientRow(row) {
  return mapRow(row, CLIENT_FIELDS);
}

/**
 * Get all clients with counts
 */
export async function getClients() {
  const supabase = getClient();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get counts for each client
  const clientIds = clients.map((c) => c.id);

  const [sourceCounts, etlCounts, kpiCounts] = await Promise.all([
    getCountsByClientId('data_sources', clientIds),
    getCountsByClientId('etl_processes', clientIds),
    getCountsByClientId('kpis', clientIds),
  ]);

  return clients.map((client) => ({
    ...mapClientRow(client),
    sourceCount: sourceCounts[client.id] || 0,
    etlCount: etlCounts[client.id] || 0,
    kpiCount: kpiCounts[client.id] || 0,
  }));
}

/**
 * Get single client by ID (without related data)
 */
export async function getClientById(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  return handleQueryResult({ data, error }, {
    fieldMap: CLIENT_FIELDS,
    single: true,
  });
}

/**
 * Create a new client
 */
export async function createClient(data) {
  const supabase = getClient();
  const clientId = data.id || generateId('c');

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      id: clientId,
      name: data.name,
      email: data.email,
      industry: data.industry || '',
      status: data.status || 'onboarding',
      notes: data.notes || '',
    })
    .select()
    .single();

  if (error) throw error;
  return mapClientRow(client);
}

/**
 * Update a client
 */
export async function updateClient(clientId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.industry !== undefined) updateData.industry = data.industry;
  if (data.status) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { data: client, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)
    .select()
    .single();

  return handleQueryResult({ data: client, error }, {
    fieldMap: CLIENT_FIELDS,
    single: true,
  });
}

/**
 * Delete a client (CASCADE handled by database)
 */
export async function deleteClient(clientId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
  return true;
}

/**
 * Get client with all related data (sources, ETL, KPIs, reports, lineage)
 * This is a composite function that calls other domain services.
 */
export async function getClientWithRelations(clientId) {
  // Import dynamically to avoid circular dependencies
  const { getClientSources } = await import('./SourceService.js');
  const { getClientETLProcesses } = await import('./ETLService.js');
  const { getClientKPIs } = await import('./KPIService.js');
  const { getClientReports } = await import('./ReportDbService.js');
  const { getClientLineage } = await import('./LineageService.js');

  const supabase = getClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const [sources, etlProcesses, kpis, reports, lineage] = await Promise.all([
    getClientSources(clientId),
    getClientETLProcesses(clientId),
    getClientKPIs(clientId),
    getClientReports(clientId),
    getClientLineage(clientId),
  ]);

  return {
    ...mapClientRow(client),
    sources,
    etlProcesses,
    kpis,
    reports,
    lineage,
  };
}
