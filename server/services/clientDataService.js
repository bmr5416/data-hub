import { supabaseService } from './supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { getPlatformMapping } from '../data/platformMappings.js';
import { getPlatformById } from '../data/platforms.js';

/**
 * Client Workbook Service
 *
 * Manages client data workspaces using Supabase.
 * Each client gets a workspace configuration with:
 * - Platform-specific data uploads
 * - Blended/harmonized data storage
 */
class ClientWorkbookService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  async init() {
    if (this.initialized) return;
    // Supabase service handles its own initialization
    this.initialized = true;
  }

  /**
   * Create a new data workspace for a client
   *
   * @param {string} clientId - Client ID
   * @param {string} clientName - Client name for the workspace
   * @returns {Object} Workspace info
   */
  async createClientWorkbook(clientId, clientName) {
    await this.init();

    const name = `${clientName} - Data Workspace`;

    // Create warehouse config in Supabase
    const warehouse = await supabaseService.createWarehouse(clientId, {
      name,
      platforms: [],
      fieldSelections: {},
      includeBlendedData: true,
    });

    return {
      workbookId: warehouse.id,
      warehouseId: warehouse.id,
      title: warehouse.name,
      createdAt: warehouse.createdAt,
    };
  }

  /**
   * Add a platform configuration to a client's workspace
   *
   * @param {string} warehouseId - Warehouse ID
   * @param {string} platformId - Platform ID (e.g., 'meta_ads', 'google_ads')
   * @param {Object} schema - Optional custom schema for selected fields
   * @returns {Object} Platform config info
   */
  async addSourceTab(warehouseId, platformId, schema = null) {
    await this.init();

    const platform = getPlatformById(platformId);
    const mapping = getPlatformMapping(platformId);

    if (!platform && platformId !== 'custom') {
      throw new Error(`Unknown platform: ${platformId}`);
    }

    // Get current warehouse
    // First find which client this warehouse belongs to
    const warehouse = await this.getWarehouseById(warehouseId);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Build headers from schema or default mapping
    // Note: Platform can be added multiple times (multi-source support)
    let headers = [];

    if (schema && schema.dimensions) {
      headers = [
        ...schema.dimensions.map((d) => d.platformField || d.canonicalId),
        ...schema.metrics.map((m) => m.platformField || m.canonicalId),
      ];
    } else if (mapping) {
      headers = [
        ...Object.values(mapping.dimensions || {}),
        ...Object.values(mapping.metrics || {}),
      ];
    } else if (platformId === 'custom') {
      headers = ['date', 'source', 'value'];
    }

    // Ensure date is first
    const dateIndex = headers.indexOf('date') !== -1 ? headers.indexOf('date') :
      headers.findIndex(h => h.toLowerCase().includes('date'));
    if (dateIndex > 0) {
      const dateHeader = headers.splice(dateIndex, 1)[0];
      headers.unshift(dateHeader);
    }

    // Update warehouse with new platform (only add if not already in array)
    const updatedPlatforms = warehouse.platforms.includes(platformId)
      ? warehouse.platforms
      : [...warehouse.platforms, platformId];

    // Store enhanced schema with selected fields and aggregation settings
    const updatedFieldSelections = {
      ...warehouse.fieldSelections,
      [platformId]: {
        headers,
        schema: schema || null,
        selectedDimensions: schema?.dimensions?.filter(d => d.selected).map(d => d.canonicalId) || [],
        selectedMetrics: schema?.metrics?.filter(m => m.selected).map(m => m.canonicalId) || [],
        aggregation: schema?.aggregation || { groupBy: ['date'], dateGranularity: 'day' }
      },
    };

    await supabaseService.updateWarehouse(warehouseId, {
      platforms: updatedPlatforms,
      fieldSelections: updatedFieldSelections,
    });

    return {
      tableName: platform?.name || platformId,
      platformId,
      headers,
      warehouseId,
    };
  }

  /**
   * Get workspace info for a client
   *
   * @param {string} warehouseId - Warehouse ID
   * @returns {Object} Workspace info including platforms
   */
  async getWorkbookInfo(warehouseId) {
    await this.init();

    const warehouse = await this.getWarehouseById(warehouseId);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Get upload info for each platform
    const uploads = await supabaseService.getClientUploads(warehouse.clientId);

    const platforms = warehouse.platforms.map((platformId) => {
      const platform = getPlatformById(platformId);
      const platformUploads = uploads.filter((u) => u.platformId === platformId);
      const latestUpload = platformUploads[0];

      return {
        name: platform?.name || platformId,
        platformId,
        headers: warehouse.fieldSelections[platformId]?.headers || [],
        hasData: platformUploads.length > 0,
        rowCount: latestUpload?.rowCount || 0,
        lastUpload: latestUpload?.uploadedAt || null,
      };
    });

    return {
      workbookId: warehouse.id,
      warehouseId: warehouse.id,
      title: warehouse.name,
      platforms,
      includeBlendedData: warehouse.includeBlendedData,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }

  /**
   * Process and store uploaded file data
   *
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @param {string} filename - Original filename
   * @param {Array} rows - Parsed data rows (array of objects)
   * @param {Array} headers - Column headers
   * @returns {Object} Upload result
   */
  async processUpload(clientId, platformId, filename, rows, headers) {
    await this.init();

    // Create upload record
    const upload = await supabaseService.createUpload(clientId, {
      platformId,
      filename: `${platformId}_${Date.now()}`,
      originalFilename: filename,
      fileSize: 0, // Could calculate from rows
      rowCount: rows.length,
      columnHeaders: headers,
    });

    try {
      // Update status to processing
      await supabaseService.updateUpload(upload.id, { status: 'processing' });

      // Insert platform data
      await supabaseService.insertPlatformData(upload.id, clientId, platformId, rows);

      // Update status to completed
      await supabaseService.updateUpload(upload.id, {
        status: 'completed',
        rowCount: rows.length,
      });

      return {
        uploadId: upload.id,
        rowsProcessed: rows.length,
        headers,
        status: 'completed',
      };
    } catch (error) {
      // Update status to error
      await supabaseService.updateUpload(upload.id, {
        status: 'error',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate data for a platform
   *
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @returns {Object} Validation results
   */
  async validateSourceData(clientId, platformId) {
    await this.init();

    const uploads = await supabaseService.getClientUploads(clientId, platformId);

    if (uploads.length === 0) {
      return {
        valid: false,
        error: `No data uploaded for platform "${platformId}"`,
        rowCount: 0,
      };
    }

    const latestUpload = uploads[0];
    const headers = latestUpload.columnHeaders || [];

    // Check for required date column
    const hasDate = headers.some(
      (h) => h.toLowerCase() === 'date' || h.toLowerCase().includes('date')
    );

    const issues = [];

    if (!hasDate) {
      issues.push('Missing date column - required for blending');
    }

    if (latestUpload.rowCount === 0) {
      issues.push('No data rows found - please upload data');
    }

    // Check for numeric fields
    const numericFields = ['impressions', 'clicks', 'spend', 'conversions', 'revenue'];
    const presentNumericFields = headers.filter((h) =>
      numericFields.some((nf) => h.toLowerCase().includes(nf))
    );

    if (presentNumericFields.length === 0) {
      issues.push('No numeric metrics found - expected at least one of: impressions, clicks, spend');
    }

    return {
      valid: issues.length === 0,
      issues,
      rowCount: latestUpload.rowCount,
      headers,
      hasDate,
      uploadId: latestUpload.id,
      uploadedAt: latestUpload.uploadedAt,
    };
  }

  /**
   * Get data from a platform upload for blending
   *
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @returns {Array} Array of row data
   */
  async getSourceData(clientId, platformId) {
    await this.init();

    const result = await supabaseService.getPlatformData(clientId, platformId);

    return result.data.map((row) => row.rowData);
  }

  /**
   * Store blended data
   *
   * @param {string} clientId - Client ID
   * @param {Array} blendedData - Array of harmonized data rows
   * @param {Array} sourcePlatforms - List of source platform IDs
   * @returns {Object} Result info
   */
  async writeBlendedData(clientId, blendedData, sourcePlatforms = []) {
    await this.init();

    // Generate batch ID
    const batchId = `blend-${uuidv4().slice(0, 8)}`;

    // Delete previous blended data for this client (optional - could keep history)
    await supabaseService.deleteBlendedData(clientId);

    // Insert new blended data
    const rowsWritten = await supabaseService.insertBlendedData(
      clientId,
      batchId,
      blendedData,
      sourcePlatforms
    );

    return {
      batchId,
      rowsWritten,
      sourcePlatforms,
      blendedAt: new Date().toISOString(),
    };
  }

  /**
   * Get blended data for a client
   *
   * @param {string} clientId - Client ID
   * @returns {Array} Array of blended data rows
   */
  async getBlendedData(clientId) {
    await this.init();

    const blendedData = await supabaseService.getBlendedData(clientId);

    return blendedData.map((row) => row.rowData);
  }

  /**
   * Get paginated preview of platform data
   *
   * @param {string} clientId - Client ID
   * @param {string} platformId - Platform ID
   * @param {number|null} limit - Row limit (null for all)
   * @param {number} offset - Row offset for pagination
   * @returns {Object} Preview data with columns, rows, and total count
   */
  async getDataPreview(clientId, platformId, limit = 10, offset = 0) {
    await this.init();

    // Get paginated data for this platform using built-in pagination
    const paginationOptions = limit !== null ? { limit, offset } : {};
    const result = await supabaseService.getPlatformData(clientId, platformId, null, paginationOptions);

    // Get column headers from latest upload
    const uploads = await supabaseService.getClientUploads(clientId, platformId);
    const columns = uploads.length > 0 ? (uploads[0].columnHeaders || []) : [];

    // Extract row data from paginated result
    const rows = result.data.map((d) => d.rowData);

    return {
      columns,
      rows,
      totalRows: result.total,
      limit,
      offset,
      platformId,
      hasMore: result.hasMore,
    };
  }

  /**
   * Get paginated preview of blended data
   *
   * @param {string} clientId - Client ID
   * @param {number|null} limit - Row limit (null for all)
   * @param {number} offset - Row offset for pagination
   * @returns {Object} Preview data with columns, rows, and total count
   */
  async getBlendedDataPreview(clientId, limit = 10, offset = 0) {
    await this.init();

    // Get all blended data
    const allData = await supabaseService.getBlendedData(clientId);
    const totalRows = allData.length;

    // Extract columns from first row (if available)
    const columns = allData.length > 0
      ? Object.keys(allData[0].rowData)
      : [];

    // Slice data for pagination
    let rows;
    if (limit === null) {
      rows = allData.map((d) => d.rowData);
    } else {
      rows = allData.slice(offset, offset + limit).map((d) => d.rowData);
    }

    return {
      columns,
      rows,
      totalRows,
      limit,
      offset,
      dataType: 'blended',
    };
  }

  /**
   * Delete all data for a workspace
   *
   * @param {string} clientId - Client ID
   * @returns {boolean} Success status
   */
  async deleteWorkbook(clientId) {
    await this.init();

    // Delete all platform data
    await supabaseService.deletePlatformData(clientId);

    // Delete all blended data
    await supabaseService.deleteBlendedData(clientId);

    return true;
  }

  /**
   * Get schema for a platform
   *
   * @param {string} platformId - Platform ID
   * @returns {Object} Schema with dimensions and metrics
   */
  getDefaultSchema(platformId) {
    const mapping = getPlatformMapping(platformId);
    const platform = getPlatformById(platformId);

    if (!mapping || !platform) {
      return null;
    }

    return {
      platformId,
      platformName: platform.name,
      dimensions: Object.entries(mapping.dimensions || {}).map(([canonical, platformField]) => ({
        canonicalId: canonical,
        platformField: platformField,
        type: 'dimension',
      })),
      metrics: Object.entries(mapping.metrics || {}).map(([canonical, platformField]) => ({
        canonicalId: canonical,
        platformField: platformField,
        type: 'metric',
        hasTransformation: !!mapping.transformations?.[canonical],
      })),
    };
  }

  /**
   * Get uploads for a client
   *
   * @param {string} clientId - Client ID
   * @param {string} platformId - Optional platform filter
   * @returns {Array} Upload records
   */
  async getUploads(clientId, platformId = null) {
    await this.init();
    return supabaseService.getClientUploads(clientId, platformId);
  }

  /**
   * Delete an upload and its data
   *
   * @param {string} uploadId - Upload ID
   * @returns {boolean} Success status
   */
  async deleteUpload(uploadId) {
    await this.init();
    return supabaseService.deleteUpload(uploadId);
  }

  /**
   * Get warehouse by ID
   *
   * @param {string} warehouseId - Warehouse ID
   * @returns {Object} Warehouse data
   */
  async getWarehouseById(warehouseId) {
    await this.init();
    return supabaseService.getWarehouseById(warehouseId);
  }

  /**
   * Remove a platform from a client's workspace
   * Deletes platform config and all related uploads
   *
   * @param {string} warehouseId - Warehouse ID
   * @param {string} platformId - Platform ID to remove
   * @param {string} clientId - Client ID for upload cleanup
   * @returns {Object} Success status
   */
  async removePlatform(warehouseId, platformId, clientId) {
    await this.init();

    const warehouse = await this.getWarehouseById(warehouseId);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    if (!warehouse.platforms.includes(platformId)) {
      throw new Error(`Platform "${platformId}" not found in this workspace`);
    }

    // Remove from platforms array
    const updatedPlatforms = warehouse.platforms.filter(p => p !== platformId);

    // Remove from fieldSelections
    const updatedFieldSelections = { ...warehouse.fieldSelections };
    delete updatedFieldSelections[platformId];

    // Update warehouse
    await supabaseService.updateWarehouse(warehouseId, {
      platforms: updatedPlatforms,
      fieldSelections: updatedFieldSelections,
    });

    // Delete related uploads and data
    await supabaseService.deleteUploadsByPlatform(clientId, platformId);

    return { success: true, platformId };
  }
}

// Singleton instance
const clientWorkbookService = new ClientWorkbookService();

export default clientWorkbookService;
export { ClientWorkbookService };
