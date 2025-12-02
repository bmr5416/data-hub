/**
 * KpiAlertRepository
 *
 * Data access layer for KPI alerts.
 * Note: This is separate from report_alerts (AlertRepository).
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class KpiAlertRepository extends BaseRepository {
  constructor() {
    super('kpi_alerts', 'alert');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      kpiId: row.kpi_id,
      condition: row.condition,
      threshold: parseFloat(row.threshold),
      channels: row.channels || [],
      recipients: row.recipients || [],
      active: row.active,
      createdAt: row.created_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.kpiId !== undefined) row.kpi_id = data.kpiId;
    }

    if (data.condition !== undefined) row.condition = data.condition;
    if (data.threshold !== undefined) row.threshold = data.threshold;
    if (data.channels !== undefined) row.channels = data.channels;
    if (data.recipients !== undefined) row.recipients = data.recipients;
    if (data.active !== undefined) row.active = data.active;

    return row;
  }

  /**
   * Find alerts by KPI ID
   * @param {string} kpiId - KPI ID
   * @returns {Promise<Array>} Array of alerts
   */
  async findByKpiId(kpiId) {
    await this.init();

    const { data, error } = await supabase
      .from('kpi_alerts')
      .select('*')
      .eq('kpi_id', kpiId);

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Find all active alerts
   * @returns {Promise<Array>} Array of active alerts
   */
  async findActive() {
    await this.init();

    const { data, error } = await supabase
      .from('kpi_alerts')
      .select('*')
      .eq('active', true);

    if (error) throw error;
    return data.map((row) => this.mapRow(row));
  }

  /**
   * Create a new KPI alert with default active state
   * @param {Object} data - Alert data
   * @returns {Promise<Object>} Created alert
   */
  async create(data) {
    await this.init();

    const alertId = this.generateId(data.id);

    const { data: alert, error } = await supabase
      .from('kpi_alerts')
      .insert({
        id: alertId,
        kpi_id: data.kpiId,
        condition: data.condition,
        threshold: data.threshold,
        channels: data.channels || [],
        recipients: data.recipients || [],
        active: data.active !== undefined ? data.active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapRow(alert);
  }

  /**
   * Enable or disable an alert
   * @param {string} alertId - Alert ID
   * @param {boolean} active - Active state
   * @returns {Promise<Object|null>} Updated alert or null if not found
   */
  async setActive(alertId, active) {
    return this.update(alertId, { active });
  }
}

export const kpiAlertRepository = new KpiAlertRepository();
