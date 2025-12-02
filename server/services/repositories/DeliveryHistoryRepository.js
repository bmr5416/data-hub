/**
 * DeliveryHistoryRepository
 *
 * Data access layer for report delivery history.
 * Tracks all report delivery attempts and their outcomes.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class DeliveryHistoryRepository extends BaseRepository {
  constructor() {
    super('report_delivery_history', 'rdh');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      reportId: row.report_id,
      deliveryFormat: row.delivery_format,
      recipients: row.recipients || [],
      status: row.status,
      errorMessage: row.error_message,
      fileSize: row.file_size,
      deliveredAt: row.delivered_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.reportId !== undefined) row.report_id = data.reportId;
      if (data.deliveryFormat !== undefined) row.delivery_format = data.deliveryFormat;
      if (data.recipients !== undefined) row.recipients = data.recipients;
    }

    if (data.status !== undefined) row.status = data.status;
    if (data.errorMessage !== undefined) row.error_message = data.errorMessage;
    if (data.fileSize !== undefined) row.file_size = data.fileSize;

    return row;
  }

  /**
   * Find delivery history by report ID
   * @param {string} reportId - Report ID
   * @param {number} limit - Maximum records to return (default: 50)
   * @returns {Promise<Array>} Array of delivery history records
   */
  async findByReportId(reportId, limit = 50) {
    await this.init();

    const { data, error } = await supabase
      .from('report_delivery_history')
      .select('*')
      .eq('report_id', reportId)
      .order('delivered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Find all delivery history ordered by date
   * @param {number} limit - Maximum records to return (default: 50)
   * @returns {Promise<Array>} Array of delivery history records
   */
  async findAll(limit = 50) {
    await this.init();

    const { data, error } = await supabase
      .from('report_delivery_history')
      .select('*')
      .order('delivered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Get the latest delivery for a report
   * @param {string} reportId - Report ID
   * @returns {Promise<Object|null>} Latest delivery record or null
   */
  async findLatest(reportId) {
    await this.init();

    const { data, error } = await supabase
      .from('report_delivery_history')
      .select('*')
      .eq('report_id', reportId)
      .order('delivered_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapRow(data);
  }

  /**
   * Create a new delivery history record
   * @param {Object} data - Delivery data
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    await this.init();

    const historyId = this.generateId(data.id);

    const { data: history, error } = await supabase
      .from('report_delivery_history')
      .insert({
        id: historyId,
        report_id: data.reportId,
        delivery_format: data.deliveryFormat,
        recipients: data.recipients || [],
        status: data.status || 'pending',
        error_message: data.errorMessage || null,
        file_size: data.fileSize || null,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapRow(history);
  }

  /**
   * Update delivery status
   * @param {string} historyId - History record ID
   * @param {string} status - New status
   * @param {string|null} errorMessage - Error message if failed
   * @returns {Promise<Object|null>} Updated record or null
   */
  async updateStatus(historyId, status, errorMessage = null) {
    return this.update(historyId, { status, errorMessage });
  }
}

export const deliveryHistoryRepository = new DeliveryHistoryRepository();
