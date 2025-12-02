/**
 * Mappings Service
 *
 * Database operations for platform field mappings.
 */

import {
  getClient,
  generateId,
} from './BaseService.js';

/**
 * Map platform mapping row
 */
function mapMappingRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    platformId: row.platform_id,
    fieldType: row.field_type,
    canonicalId: row.canonical_id,
    platformFieldName: row.platform_field_name,
    transformation: row.transformation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get custom platform mappings for a client
 */
export async function getClientPlatformMappings(clientId, platformId = null) {
  const supabase = getClient();

  let query = supabase
    .from('platform_mappings')
    .select('*')
    .eq('client_id', clientId);

  if (platformId) {
    query = query.eq('platform_id', platformId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapMappingRow);
}

/**
 * Create a custom platform mapping
 */
export async function createPlatformMapping(data) {
  const supabase = getClient();
  const mappingId = generateId('pm');

  const { data: mapping, error } = await supabase
    .from('platform_mappings')
    .insert({
      id: mappingId,
      client_id: data.clientId,
      platform_id: data.platformId,
      field_type: data.fieldType,
      canonical_id: data.canonicalId,
      platform_field_name: data.platformFieldName,
      transformation: data.transformation || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMappingRow(mapping);
}

/**
 * Update a custom platform mapping
 */
export async function updatePlatformMapping(mappingId, data) {
  const supabase = getClient();

  const updates = {};
  if (data.platformFieldName !== undefined) {
    updates.platform_field_name = data.platformFieldName;
  }
  if (data.transformation !== undefined) {
    updates.transformation = data.transformation;
  }

  const { data: mapping, error } = await supabase
    .from('platform_mappings')
    .update(updates)
    .eq('id', mappingId)
    .select()
    .single();

  if (error) throw error;
  return mapMappingRow(mapping);
}

/**
 * Delete a custom platform mapping
 */
export async function deletePlatformMapping(mappingId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('platform_mappings')
    .delete()
    .eq('id', mappingId);

  if (error) throw error;
  return true;
}
