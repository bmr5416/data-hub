/**
 * BaseRepository
 *
 * Abstract base class providing common CRUD operations for Supabase tables.
 * Extend this class for entity-specific repositories.
 *
 * Features:
 * - Automatic initialization check
 * - ID generation with entity-specific prefixes
 * - Snake_case to camelCase row mapping
 * - PGRST116 (not found) error handling
 * - Pagination support
 */

import { supabase } from '../supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

export class BaseRepository {
  /**
   * Create a repository for a specific table
   * @param {string} tableName - Supabase table name
   * @param {string} idPrefix - Prefix for generated IDs (e.g., 'c' for clients)
   */
  constructor(tableName, idPrefix = null) {
    this.tableName = tableName;
    this.idPrefix = idPrefix;
    this.initialized = false;
  }

  /**
   * Ensure Supabase client is available
   * @throws {Error} If Supabase is not configured
   */
  async init() {
    if (this.initialized) return;
    if (!supabase) {
      throw new Error('Supabase client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    this.initialized = true;
  }

  /**
   * Generate a prefixed ID for new entities
   * @param {string} existingId - Optional existing ID to use
   * @returns {string} Generated or existing ID
   */
  generateId(existingId = null) {
    if (existingId) return existingId;
    if (this.idPrefix) {
      return `${this.idPrefix}-${uuidv4().slice(0, 8)}`;
    }
    return uuidv4();
  }

  // ========== CORE CRUD OPERATIONS ==========

  /**
   * Find all records with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {string} options.orderBy - Column to order by (default: created_at)
   * @param {boolean} options.ascending - Sort direction (default: false)
   * @param {number} options.limit - Maximum records to return
   * @param {number} options.offset - Records to skip
   * @param {Object} options.filters - Key-value pairs for eq() filters
   * @returns {Promise<Array>} Mapped records
   */
  async findAll(options = {}) {
    await this.init();

    const {
      orderBy = 'created_at',
      ascending = false,
      limit = null,
      offset = null,
      filters = {},
    } = options;

    let query = supabase
      .from(this.tableName)
      .select('*')
      .order(orderBy, { ascending });

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }

    // Apply pagination
    if (limit !== null && offset !== null) {
      query = query.range(offset, offset + limit - 1);
    } else if (limit !== null) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Find a single record by ID
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>} Mapped record or null if not found
   */
  async findById(id) {
    await this.init();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapRow(data);
  }

  /**
   * Find records by client ID
   * @param {string} clientId - Client ID
   * @param {Object} options - Query options (same as findAll)
   * @returns {Promise<Array>} Mapped records
   */
  async findByClientId(clientId, options = {}) {
    return this.findAll({
      ...options,
      filters: { ...options.filters, client_id: clientId },
    });
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created and mapped record
   */
  async create(data) {
    await this.init();

    const id = this.generateId(data.id);
    const row = this.toDbRow({ ...data, id });

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return this.mapRow(result);
  }

  /**
   * Update an existing record
   * @param {string} id - Record ID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object|null>} Updated and mapped record, or null if not found
   */
  async update(id, data) {
    await this.init();

    const updates = this.toDbRow(data, true);

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapRow(result);
  }

  /**
   * Delete a record by ID
   * @param {string} id - Record ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    await this.init();

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Count records with optional filters
   * @param {Object} filters - Key-value pairs for eq() filters
   * @returns {Promise<number>} Record count
   */
  async count(filters = {}) {
    await this.init();

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  /**
   * Check if a record exists by ID
   * @param {string} id - Record ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    await this.init();

    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (error) throw error;
    return count > 0;
  }

  // ========== ROW MAPPING (Override in subclasses) ==========

  /**
   * Map a database row to API format (snake_case to camelCase)
   * Override in subclasses for entity-specific mapping
   * @param {Object} row - Database row
   * @returns {Object} Mapped object
   */
  mapRow(row) {
    if (!row) return null;

    // Default: convert snake_case to camelCase for common fields
    const mapped = {};

    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      mapped[camelKey] = value;
    }

    return mapped;
  }

  /**
   * Convert API data to database row format (camelCase to snake_case)
   * Override in subclasses for entity-specific conversion
   * @param {Object} data - API data
   * @param {boolean} isUpdate - If true, only include defined fields
   * @returns {Object} Database row
   */
  toDbRow(data, isUpdate = false) {
    if (!data) return {};

    const row = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip undefined values on update (don't overwrite with null)
      if (isUpdate && value === undefined) continue;

      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      row[snakeKey] = value;
    }

    return row;
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get counts grouped by a foreign key
   * Useful for getting source counts per client, etc.
   * @param {string} foreignKey - Column name to group by
   * @param {string[]} ids - IDs to count for
   * @returns {Promise<Object>} Map of ID to count
   */
  async getCountsBy(foreignKey, ids) {
    if (!ids || ids.length === 0) return {};

    await this.init();

    const { data, error } = await supabase
      .from(this.tableName)
      .select(foreignKey)
      .in(foreignKey, ids);

    if (error) throw error;

    const counts = {};
    for (const row of data) {
      const id = row[foreignKey];
      counts[id] = (counts[id] || 0) + 1;
    }

    return counts;
  }

  /**
   * Bulk insert records
   * @param {Array<Object>} records - Records to insert
   * @param {number} batchSize - Records per batch (default: 100)
   * @returns {Promise<{ inserted: number, failed: number }>} Result summary
   */
  async bulkCreate(records, batchSize = 100) {
    await this.init();

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const rows = batch.map((record) => {
        const id = this.generateId(record.id);
        return this.toDbRow({ ...record, id });
      });

      const { error } = await supabase
        .from(this.tableName)
        .insert(rows);

      if (error) {
        failed += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    return { inserted, failed };
  }

  /**
   * Delete all records matching a filter
   * @param {Object} filters - Key-value pairs for eq() filters
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteWhere(filters) {
    await this.init();

    // First count how many will be deleted
    const countBefore = await this.count(filters);

    let query = supabase.from(this.tableName).delete();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }

    const { error } = await query;
    if (error) throw error;

    return countBefore;
  }
}
