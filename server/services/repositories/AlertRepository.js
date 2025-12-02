/**
 * AlertRepository
 *
 * Data access layer for report alert operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class AlertRepository extends BaseRepository {
  constructor() {
    super('report_alerts', 'alt');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      reportId: row.report_id,
      name: row.name,
      type: row.type,
      config: row.config || {},
      isEnabled: row.is_enabled,
      lastTriggeredAt: row.last_triggered_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  toDbRow(data, isUpdate = false) {
    const row = {};

    if (!isUpdate) {
      row.id = data.id;
      if (data.reportId) row.report_id = data.reportId;
    }

    if (data.name !== undefined) row.name = data.name;
    if (data.type !== undefined) row.type = data.type;
    if (data.config !== undefined) row.config = data.config;
    if (data.isEnabled !== undefined) row.is_enabled = data.isEnabled;
    if (data.lastTriggeredAt !== undefined) row.last_triggered_at = data.lastTriggeredAt;

    return row;
  }

  /**
   * Find alerts by report
   */
  async findByReportId(reportId) {
    return this.findAll({ filters: { report_id: reportId } });
  }

  /**
   * Find enabled alerts
   */
  async findEnabled() {
    return this.findAll({ filters: { is_enabled: true } });
  }

  /**
   * Find enabled alerts by report
   */
  async findEnabledByReportId(reportId) {
    return this.findAll({
      filters: {
        report_id: reportId,
        is_enabled: true,
      },
    });
  }

  /**
   * Update last triggered timestamp
   */
  async updateLastTriggered(alertId) {
    return this.update(alertId, { lastTriggeredAt: new Date().toISOString() });
  }

  /**
   * Enable/disable alert
   */
  async setEnabled(alertId, isEnabled) {
    return this.update(alertId, { isEnabled });
  }

  // ========== ALERT HISTORY ==========

  /**
   * Record alert trigger in history
   */
  async recordTrigger(alertId, details = {}) {
    await this.init();

    const { error } = await supabase
      .from('report_alert_history')
      .insert({
        alert_id: alertId,
        triggered_at: new Date().toISOString(),
        details,
      });

    if (error) throw error;

    // Update last triggered timestamp
    await this.updateLastTriggered(alertId);

    return true;
  }

  /**
   * Get alert history
   */
  async getHistory(alertId, limit = 50) {
    await this.init();

    const { data, error } = await supabase
      .from('report_alert_history')
      .select('*')
      .eq('alert_id', alertId)
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      alertId: row.alert_id,
      triggeredAt: row.triggered_at,
      details: row.details || {},
    }));
  }
}

export const alertRepository = new AlertRepository();
