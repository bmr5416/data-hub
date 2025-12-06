/**
 * WarehouseRepository
 *
 * Data access layer for data warehouse operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';

class WarehouseRepository extends BaseRepository {
  constructor() {
    super('data_warehouses', 'wh');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      platforms: row.platforms || [],
      fieldSelections: row.field_selections || {},
      includeBlendedTable: row.include_blended_data,
      status: row.status,
      lastSyncAt: row.last_sync_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.clientId) row.client_id = data.clientId;
    }

    if (data.name !== undefined) row.name = data.name;
    if (data.platforms !== undefined) row.platforms = data.platforms;
    if (data.fieldSelections !== undefined) row.field_selections = data.fieldSelections;
    if (data.includeBlendedTable !== undefined) row.include_blended_data = data.includeBlendedTable;
    if (data.status !== undefined) row.status = data.status;
    if (data.lastSyncAt !== undefined) row.last_sync_at = data.lastSyncAt;

    return row;
  }

  /**
   * Create warehouse with client ID
   */
  async createForClient(clientId, data) {
    return this.create({ ...data, clientId });
  }

  /**
   * Find warehouses by status
   */
  async findByStatus(status) {
    return this.findAll({ filters: { status } });
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(warehouseId) {
    return this.update(warehouseId, { lastSyncAt: new Date().toISOString() });
  }

  /**
   * Add platform to warehouse
   */
  async addPlatform(warehouseId, platform, fieldSelection) {
    const warehouse = await this.findById(warehouseId);
    if (!warehouse) return null;

    const platforms = [...(warehouse.platforms || [])];
    if (!platforms.includes(platform)) {
      platforms.push(platform);
    }

    const fieldSelections = { ...warehouse.fieldSelections, [platform]: fieldSelection };

    return this.update(warehouseId, { platforms, fieldSelections });
  }

  /**
   * Remove platform from warehouse
   */
  async removePlatform(warehouseId, platform) {
    const warehouse = await this.findById(warehouseId);
    if (!warehouse) return null;

    const platforms = (warehouse.platforms || []).filter((p) => p !== platform);
    const fieldSelections = { ...warehouse.fieldSelections };
    delete fieldSelections[platform];

    return this.update(warehouseId, { platforms, fieldSelections });
  }
}

export const warehouseRepository = new WarehouseRepository();
