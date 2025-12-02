/**
 * ClientRepository
 *
 * Data access layer for client operations.
 * Extends BaseRepository with client-specific methods.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class ClientRepository extends BaseRepository {
  constructor() {
    super('clients', 'c');
  }

  /**
   * Map database row to API format
   */
  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      industry: row.industry,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  /**
   * Convert API data to database row
   */
  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
    }

    if (data.name !== undefined) row.name = data.name;
    if (data.email !== undefined) row.email = data.email;
    if (data.industry !== undefined) row.industry = data.industry;
    if (data.status !== undefined) row.status = data.status;
    if (data.notes !== undefined) row.notes = data.notes;

    return row;
  }

  // ========== CLIENT-SPECIFIC METHODS ==========

  /**
   * Find all clients with related entity counts
   * Optimized: Uses aggregation instead of N+1 queries
   * @returns {Promise<Array>} Clients with sourceCount, etlCount, kpiCount
   */
  async findAllWithCounts() {
    await this.init();

    // Get all clients first
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (clients.length === 0) return [];

    const clientIds = clients.map((c) => c.id);

    // Get counts in parallel (optimized with IN clause)
    const [sourceCounts, etlCounts, kpiCounts] = await Promise.all([
      this.getEntityCounts('data_sources', clientIds),
      this.getEntityCounts('etl_processes', clientIds),
      this.getEntityCounts('kpis', clientIds),
    ]);

    return clients.map((client) => ({
      ...this.mapRow(client),
      sourceCount: sourceCounts[client.id] || 0,
      etlCount: etlCounts[client.id] || 0,
      kpiCount: kpiCounts[client.id] || 0,
    }));
  }

  /**
   * Get entity counts grouped by client_id
   * @private
   */
  async getEntityCounts(tableName, clientIds) {
    if (clientIds.length === 0) return {};

    const { data, error } = await supabase
      .from(tableName)
      .select('client_id')
      .in('client_id', clientIds);

    if (error) throw error;

    const counts = {};
    for (const row of data) {
      counts[row.client_id] = (counts[row.client_id] || 0) + 1;
    }
    return counts;
  }

  /**
   * Find client by ID with all related entities
   * @param {string} clientId - Client ID
   * @param {Object} repositories - Object containing related repositories
   * @returns {Promise<Object|null>} Client with sources, etlProcesses, kpis, reports, lineage
   */
  async findByIdWithRelations(clientId, repositories = {}) {
    const client = await this.findById(clientId);
    if (!client) return null;

    // If repositories provided, fetch related entities
    const {
      sourceRepository,
      etlRepository,
      kpiRepository,
      reportRepository,
      lineageRepository,
    } = repositories;

    const [sources, etlProcesses, kpis, reports, lineage] = await Promise.all([
      sourceRepository?.findByClientId(clientId) || [],
      etlRepository?.findByClientId(clientId) || [],
      kpiRepository?.findByClientId(clientId) || [],
      reportRepository?.findByClientId(clientId) || [],
      lineageRepository?.findByClientId(clientId) || [],
    ]);

    return {
      ...client,
      sources,
      etlProcesses,
      kpis,
      reports,
      lineage,
    };
  }

  /**
   * Search clients by name or email
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching clients
   */
  async search(query) {
    await this.init();

    const searchPattern = `%${query}%`;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.${searchPattern},email.ilike.${searchPattern}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Find clients by status
   * @param {string} status - Client status
   * @returns {Promise<Array>} Clients with matching status
   */
  async findByStatus(status) {
    return this.findAll({ filters: { status } });
  }
}

// Export singleton instance
export const clientRepository = new ClientRepository();
