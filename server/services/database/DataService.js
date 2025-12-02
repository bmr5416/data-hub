/**
 * Data Service
 *
 * Database operations for platform data, uploads, and blended data.
 */

import {
  getClient,
  generateId,
  mapRow,
} from './BaseService.js';
import logger from '../../utils/logger.js';

// ========== UPLOAD FIELD MAPPING ==========

const UPLOAD_FIELDS = {
  id: 'id',
  client_id: 'clientId',
  platform_id: 'platformId',
  filename: 'filename',
  original_filename: 'originalFilename',
  file_size: 'fileSize',
  row_count: 'rowCount',
  column_headers: 'columnHeaders',
  status: 'status',
  error_message: 'errorMessage',
  uploaded_at: 'uploadedAt',
};

/**
 * Map upload row, handling column_headers array
 */
function mapUploadRow(row) {
  if (!row) return null;
  const mapped = mapRow(row, UPLOAD_FIELDS);
  mapped.columnHeaders = row.column_headers || [];
  return mapped;
}

// ========== PLATFORM UPLOAD OPERATIONS ==========

/**
 * Get uploads for a client
 */
export async function getClientUploads(clientId, platformId = null) {
  const supabase = getClient();

  let query = supabase
    .from('platform_uploads')
    .select('*')
    .eq('client_id', clientId)
    .order('uploaded_at', { ascending: false });

  if (platformId) {
    query = query.eq('platform_id', platformId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapUploadRow);
}

/**
 * Get upload by ID
 */
export async function getUpload(uploadId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('platform_uploads')
    .select('*')
    .eq('id', uploadId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapUploadRow(data);
}

/**
 * Create an upload record
 */
export async function createUpload(clientId, data) {
  const supabase = getClient();
  const uploadId = generateId('up');

  const { data: upload, error } = await supabase
    .from('platform_uploads')
    .insert({
      id: uploadId,
      client_id: clientId,
      platform_id: data.platformId,
      filename: data.filename,
      original_filename: data.originalFilename,
      file_size: data.fileSize || 0,
      row_count: data.rowCount || 0,
      column_headers: data.columnHeaders || [],
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return mapUploadRow(upload);
}

/**
 * Update an upload record
 */
export async function updateUpload(uploadId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.rowCount !== undefined) updateData.row_count = data.rowCount;
  if (data.columnHeaders) updateData.column_headers = data.columnHeaders;
  if (data.status) updateData.status = data.status;
  if (data.errorMessage !== undefined) updateData.error_message = data.errorMessage;

  const { data: upload, error } = await supabase
    .from('platform_uploads')
    .update(updateData)
    .eq('id', uploadId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapUploadRow(upload);
}

/**
 * Delete an upload (CASCADE deletes associated platform_data)
 */
export async function deleteUpload(uploadId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('platform_uploads')
    .delete()
    .eq('id', uploadId);

  if (error) throw error;
  return true;
}

/**
 * Delete all uploads for a specific platform
 */
export async function deleteUploadsByPlatform(clientId, platformId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('platform_uploads')
    .delete()
    .eq('client_id', clientId)
    .eq('platform_id', platformId);

  if (error) throw error;
  return true;
}

// ========== PLATFORM DATA OPERATIONS ==========

/**
 * Map platform data row
 */
function mapPlatformDataRow(row) {
  return {
    id: row.id,
    uploadId: row.upload_id,
    clientId: row.client_id,
    platformId: row.platform_id,
    rowIndex: row.row_index,
    rowData: row.row_data,
    createdAt: row.created_at,
  };
}

/**
 * Get platform data for a client with optional pagination
 * @param {string} clientId - Client ID
 * @param {string|null} platformId - Optional platform filter
 * @param {string|null} uploadId - Optional upload filter
 * @param {Object} options - Pagination options
 * @param {number} options.limit - Max rows to return
 * @param {number} options.offset - Rows to skip
 * @returns {Promise<Object>} { data, hasMore, total }
 */
export async function getPlatformData(clientId, platformId = null, uploadId = null, options = {}) {
  const supabase = getClient();
  const { limit, offset = 0 } = options;

  // Get total count first
  let countQuery = supabase
    .from('platform_data')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (platformId) countQuery = countQuery.eq('platform_id', platformId);
  if (uploadId) countQuery = countQuery.eq('upload_id', uploadId);

  const { count: total, error: countError } = await countQuery;
  if (countError) throw countError;

  // Build data query
  let query = supabase
    .from('platform_data')
    .select('*')
    .eq('client_id', clientId)
    .order('row_index', { ascending: true });

  if (platformId) query = query.eq('platform_id', platformId);
  if (uploadId) query = query.eq('upload_id', uploadId);

  // Apply pagination
  if (offset > 0) {
    query = query.range(offset, limit ? offset + limit - 1 : offset + 999);
  } else if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    data: data.map(mapPlatformDataRow),
    hasMore: limit ? (offset + data.length) < total : false,
    total: total || 0,
  };
}

/**
 * Get platform data filtered by date range with optional pagination
 * @param {string} clientId - Client ID
 * @param {string|null} platformId - Optional platform filter
 * @param {string} startDate - Start date (inclusive)
 * @param {string} endDate - End date (inclusive)
 * @param {string} dateField - Field name in row_data to filter on
 * @param {Object} options - Pagination options
 * @param {number} options.limit - Max rows to return
 * @param {number} options.offset - Rows to skip
 * @returns {Promise<Object>} { data, hasMore, total }
 */
export async function getPlatformDataByDateRange(
  clientId,
  platformId = null,
  startDate,
  endDate,
  dateField = 'date',
  options = {}
) {
  const supabase = getClient();
  const { limit, offset = 0 } = options;

  // Get total count first
  let countQuery = supabase
    .from('platform_data')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte(`row_data->>${dateField}`, startDate)
    .lte(`row_data->>${dateField}`, endDate);

  if (platformId) countQuery = countQuery.eq('platform_id', platformId);

  const { count: total, error: countError } = await countQuery;
  if (countError) throw countError;

  // Build data query
  let query = supabase
    .from('platform_data')
    .select('*')
    .eq('client_id', clientId)
    .gte(`row_data->>${dateField}`, startDate)
    .lte(`row_data->>${dateField}`, endDate)
    .order('row_index', { ascending: true });

  if (platformId) query = query.eq('platform_id', platformId);

  // Apply pagination
  if (offset > 0) {
    query = query.range(offset, limit ? offset + limit - 1 : offset + 999);
  } else if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    data: data.map(mapPlatformDataRow),
    hasMore: limit ? (offset + data.length) < total : false,
    total: total || 0,
  };
}

/**
 * Insert platform data rows (batched, transaction-safe)
 * Rolls back all inserted rows if any batch fails
 */
export async function insertPlatformData(uploadId, clientId, platformId, rows) {
  const supabase = getClient();

  const insertRows = rows.map((rowData, index) => ({
    id: generateId('pd'),
    upload_id: uploadId,
    client_id: clientId,
    platform_id: platformId,
    row_index: index,
    row_data: rowData,
  }));

  // Insert in batches of 100 to avoid payload limits
  // Uses transaction-safe pattern: rollback all on failure
  const batchSize = 100;
  let totalInserted = 0;
  const insertedBatchIds = [];

  try {
    for (let i = 0; i < insertRows.length; i += batchSize) {
      const batch = insertRows.slice(i, i + batchSize);
      const batchIds = batch.map(row => row.id);

      const { error } = await supabase.from('platform_data').insert(batch);
      if (error) throw error;

      insertedBatchIds.push(...batchIds);
      totalInserted += batch.length;
    }

    return totalInserted;
  } catch (error) {
    // Rollback: delete all rows inserted in this transaction
    if (insertedBatchIds.length > 0) {
      logger.warn('Bulk insert failed, rolling back inserted rows', {
        uploadId,
        platformId,
        insertedCount: insertedBatchIds.length,
        error: error.message,
      });

      try {
        // Delete by uploadId is more efficient than individual IDs
        await supabase
          .from('platform_data')
          .delete()
          .eq('upload_id', uploadId);
      } catch (rollbackError) {
        logger.error('Rollback failed during bulk insert', {
          uploadId,
          platformId,
          rollbackError: rollbackError.message,
        });
        // Still throw the original error
      }
    }

    throw error;
  }
}

/**
 * Delete platform data
 */
export async function deletePlatformData(clientId, platformId = null, uploadId = null) {
  const supabase = getClient();

  let query = supabase.from('platform_data').delete().eq('client_id', clientId);

  if (platformId) {
    query = query.eq('platform_id', platformId);
  }
  if (uploadId) {
    query = query.eq('upload_id', uploadId);
  }

  const { error } = await query;
  if (error) throw error;
  return true;
}

// ========== BLENDED DATA OPERATIONS ==========

/**
 * Map blended data row
 */
function mapBlendedDataRow(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    batchId: row.blend_batch_id,
    rowData: row.row_data,
    sourcePlatforms: row.source_platforms || [],
    blendedAt: row.blended_at,
  };
}

/**
 * Get blended data for a client
 */
export async function getBlendedData(clientId, batchId = null) {
  const supabase = getClient();

  let query = supabase
    .from('blended_data')
    .select('*')
    .eq('client_id', clientId)
    .order('blended_at', { ascending: false });

  if (batchId) {
    query = query.eq('blend_batch_id', batchId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapBlendedDataRow);
}

/**
 * Insert blended data rows (batched)
 */
export async function insertBlendedData(clientId, batchId, rows, sourcePlatforms) {
  const supabase = getClient();

  const insertRows = rows.map((rowData) => ({
    id: generateId('bd'),
    client_id: clientId,
    blend_batch_id: batchId,
    row_data: rowData,
    source_platforms: sourcePlatforms,
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < insertRows.length; i += batchSize) {
    const batch = insertRows.slice(i, i + batchSize);
    const { error } = await supabase.from('blended_data').insert(batch);
    if (error) throw error;
    totalInserted += batch.length;
  }

  return totalInserted;
}

/**
 * Delete blended data
 */
export async function deleteBlendedData(clientId, batchId = null) {
  const supabase = getClient();

  let query = supabase.from('blended_data').delete().eq('client_id', clientId);

  if (batchId) {
    query = query.eq('blend_batch_id', batchId);
  }

  const { error } = await query;
  if (error) throw error;
  return true;
}

/**
 * Get latest blend batch info
 */
export async function getLatestBlendBatch(clientId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('blended_data')
    .select('blend_batch_id, blended_at')
    .eq('client_id', clientId)
    .order('blended_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    batchId: data.blend_batch_id,
    blendedAt: data.blended_at,
  };
}
