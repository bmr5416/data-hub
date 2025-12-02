/**
 * Lineage Service
 *
 * Database operations for data lineage connections.
 */

import {
  getClient,
  generateId,
} from './BaseService.js';

/**
 * Map lineage row to JS object
 */
function mapLineageRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    sourceId: row.source_id,
    destinationType: row.destination_type,
    destinationId: row.destination_id,
    transformationNotes: row.transformation_notes,
  };
}

/**
 * Get lineage connections for a client
 */
export async function getClientLineage(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('data_lineage')
    .select('*')
    .eq('client_id', clientId);

  if (error) throw error;
  return data.map(mapLineageRow);
}

/**
 * Create a lineage connection
 */
export async function createLineage(data) {
  const supabase = getClient();
  const lineageId = generateId('l');

  const { data: lineage, error } = await supabase
    .from('data_lineage')
    .insert({
      id: lineageId,
      client_id: data.clientId,
      source_id: data.sourceId,
      destination_type: data.destinationType,
      destination_id: data.destinationId,
      transformation_notes: data.transformationNotes || '',
    })
    .select()
    .single();

  if (error) throw error;
  return mapLineageRow(lineage);
}

/**
 * Delete a lineage connection
 */
export async function deleteLineage(lineageId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('data_lineage')
    .delete()
    .eq('id', lineageId);

  if (error) throw error;
  return true;
}
