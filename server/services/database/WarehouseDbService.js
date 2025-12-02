/**
 * Warehouse Database Service
 *
 * Database operations for data warehouses.
 */

import {
  getClient,
  generateId,
} from './BaseService.js';

/**
 * Map warehouse row to JS object
 */
function mapWarehouseRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    platforms: row.platforms || [],
    fieldSelections: row.field_selections || {},
    includeBlendedData: row.include_blended_data,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get warehouses for a client
 */
export async function getClientWarehouses(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('data_warehouses')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapWarehouseRow);
}

/**
 * Get warehouse by ID
 */
export async function getWarehouseById(warehouseId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('data_warehouses')
    .select('*')
    .eq('id', warehouseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapWarehouseRow(data);
}

/**
 * Create a warehouse
 */
export async function createWarehouse(clientId, data) {
  const supabase = getClient();
  const warehouseId = generateId('wh');

  const { data: warehouse, error } = await supabase
    .from('data_warehouses')
    .insert({
      id: warehouseId,
      client_id: clientId,
      name: data.name,
      platforms: data.platforms || [],
      field_selections: data.fieldSelections || {},
      include_blended_data: data.includeBlendedData !== false,
      schema_version: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return mapWarehouseRow(warehouse);
}

/**
 * Update a warehouse
 */
export async function updateWarehouse(warehouseId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.platforms) updateData.platforms = data.platforms;
  if (data.fieldSelections) updateData.field_selections = data.fieldSelections;
  if (data.includeBlendedData !== undefined) {
    updateData.include_blended_data = data.includeBlendedData;
  }
  if (data.schemaVersion) updateData.schema_version = data.schemaVersion;

  const { data: warehouse, error } = await supabase
    .from('data_warehouses')
    .update(updateData)
    .eq('id', warehouseId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapWarehouseRow(warehouse);
}

/**
 * Delete a warehouse
 */
export async function deleteWarehouse(warehouseId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('data_warehouses')
    .delete()
    .eq('id', warehouseId);

  if (error) throw error;
  return true;
}
