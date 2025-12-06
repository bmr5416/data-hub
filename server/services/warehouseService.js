import { warehouseRepository, platformDataRepository } from './repositories/index.js';
import { getDimensionById } from '../data/dimensions.js';
import { getMetricById } from '../data/metrics.js';
import { getPlatformById } from '../data/platforms.js';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'WarehouseService' });

/**
 * Warehouse Service
 *
 * Manages data warehouse metadata in Supabase.
 * No external spreadsheet creation - warehouses are metadata-only records.
 */
class WarehouseService {
  /**
   * Create a new data warehouse for a client
   * Stores warehouse metadata in Supabase
   */
  async createWarehouse({
    clientId,
    clientName,
    name,
    platforms,
    fieldSelections,
    includeBlendedTable = true
  }) {
    try {
      // Create warehouse name
      const warehouseName = name || `${clientName} Data Warehouse`;

      // Build platform schemas for reference
      const platformSchemas = {};
      const allDimensions = new Set();
      const allMetrics = new Set();

      for (const platformId of platforms) {
        const platformName = this.getPlatformDisplayName(platformId);
        const tableName = platformName.replace(/\s+/g, '_');

        // Build headers for this platform
        const headers = this.buildHeaderRow(
          fieldSelections[platformId],
          platformId
        );

        // Store schema
        platformSchemas[platformId] = {
          tableName,
          dimensions: fieldSelections[platformId]?.dimensions || [],
          metrics: fieldSelections[platformId]?.metrics || [],
          headers,
        };

        // Collect all dimensions and metrics
        const selection = fieldSelections[platformId];
        if (selection?.dimensions) selection.dimensions.forEach(d => allDimensions.add(d));
        if (selection?.metrics) selection.metrics.forEach(m => allMetrics.add(m));
      }

      // Store warehouse metadata in Supabase
      const warehouse = await warehouseRepository.createForClient(clientId, {
        name: warehouseName,
        platforms,
        fieldSelections,
        includeBlendedData: includeBlendedTable,
      });

      return warehouse;
    } catch (error) {
      log.error('Error creating warehouse', { error: error.message });
      throw new Error(`Failed to create warehouse: ${error.message}`);
    }
  }

  /**
   * Get warehouse details
   */
  async getWarehouse(warehouseId) {
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) return null;
    return warehouse;
  }

  /**
   * Get warehouse schema (all tables and their columns)
   */
  async getWarehouseSchema(warehouseId) {
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) return null;

    // Build schema from fieldSelections
    const platformSchemas = {};

    for (const platformId of warehouse.platforms || []) {
      const selection = warehouse.fieldSelections?.[platformId] || {};
      const headers = this.buildHeaderRow(selection, platformId);
      const platformName = this.getPlatformDisplayName(platformId);

      platformSchemas[platformId] = {
        tableName: platformName.replace(/\s+/g, '_'),
        dimensions: selection.dimensions || [],
        metrics: selection.metrics || [],
        headers,
      };
    }

    return {
      platforms: platformSchemas,
      blendedSchema: this.buildBlendedHeadersFromSelections(warehouse.fieldSelections || {}),
    };
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStats(warehouseId) {
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) return null;

    const platforms = warehouse.platforms || [];
    const clientId = warehouse.clientId;

    // Get actual row count from platform_data for this warehouse's platforms
    const totalRows = platforms.length > 0 && clientId
      ? await platformDataRepository.countByClientId(clientId, platforms)
      : 0;

    // Get the latest upload date for this warehouse's platforms
    const lastImport = platforms.length > 0 && clientId
      ? await platformDataRepository.getLatestUploadDate(clientId, platforms)
      : null;

    return {
      warehouseId,
      platformCount: platforms.length,
      totalRows,
      lastImport,
    };
  }

  /**
   * Build header row for a platform table
   */
  buildHeaderRow(fieldSelection, _platformId) {
    const headers = [];

    // Add dimension headers
    if (fieldSelection?.dimensions) {
      fieldSelection.dimensions.forEach(dimId => {
        const dimension = getDimensionById(dimId);
        if (dimension) {
          headers.push(dimension.name);
        }
      });
    }

    // Add metric headers
    if (fieldSelection?.metrics) {
      fieldSelection.metrics.forEach(metricId => {
        const metric = getMetricById(metricId);
        if (metric) {
          headers.push(metric.name);
        }
      });
    }

    return headers;
  }

  /**
   * Build blended data headers from field selections
   */
  buildBlendedHeaders(fieldSelections) {
    const allFields = new Set();

    Object.values(fieldSelections || {}).forEach(selection => {
      if (selection?.dimensions) {
        selection.dimensions.forEach(dimId => {
          const dimension = getDimensionById(dimId);
          if (dimension) allFields.add(dimension.name);
        });
      }
      if (selection?.metrics) {
        selection.metrics.forEach(metricId => {
          const metric = getMetricById(metricId);
          if (metric) allFields.add(metric.name);
        });
      }
    });

    return Array.from(allFields);
  }

  /**
   * Build blended headers from field selections
   */
  buildBlendedHeadersFromSelections(fieldSelections) {
    return this.buildBlendedHeaders(fieldSelections);
  }

  /**
   * Get platform display name from platform registry
   */
  getPlatformDisplayName(platformId) {
    const platform = getPlatformById(platformId);
    return platform ? platform.name : platformId;
  }
}

export default new WarehouseService();
