/**
 * UploadRepository
 *
 * Data access layer for platform upload tracking.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class UploadRepository extends BaseRepository {
  constructor() {
    super('platform_uploads', 'up');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      warehouseId: row.warehouse_id,
      platformId: row.platform_id,
      filename: row.filename,
      rowCount: row.row_count,
      status: row.status,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
      errorMessage: row.error_message,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId) row.client_id = data.clientId;
    }

    if (data.warehouseId !== undefined) row.warehouse_id = data.warehouseId;
    if (data.platformId !== undefined) row.platform_id = data.platformId;
    if (data.filename !== undefined) row.filename = data.filename;
    if (data.rowCount !== undefined) row.row_count = data.rowCount;
    if (data.status !== undefined) row.status = data.status;
    if (data.uploadedBy !== undefined) row.uploaded_by = data.uploadedBy;
    if (data.uploadedAt !== undefined) row.uploaded_at = data.uploadedAt;
    if (data.errorMessage !== undefined) row.error_message = data.errorMessage;

    return row;
  }

  /**
   * Find uploads by warehouse
   */
  async findByWarehouseId(warehouseId) {
    return this.findAll({ filters: { warehouse_id: warehouseId } });
  }

  /**
   * Find uploads by platform
   */
  async findByPlatformId(warehouseId, platformId) {
    return this.findAll({
      filters: {
        warehouse_id: warehouseId,
        platform_id: platformId,
      },
    });
  }

  /**
   * Get latest upload for a platform
   */
  async findLatest(warehouseId, platformId) {
    await this.init();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('warehouse_id', warehouseId)
      .eq('platform_id', platformId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapRow(data);
  }

  /**
   * Delete all uploads for a platform
   */
  async deleteByPlatform(warehouseId, platformId) {
    return this.deleteWhere({
      warehouse_id: warehouseId,
      platform_id: platformId,
    });
  }
}

export const uploadRepository = new UploadRepository();
