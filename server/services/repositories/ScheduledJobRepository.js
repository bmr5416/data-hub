/**
 * ScheduledJobRepository
 *
 * Data access layer for scheduled job operations.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { supabase } from '../supabaseClient.js';

class ScheduledJobRepository extends BaseRepository {
  constructor() {
    super('scheduled_jobs', 'job');
  }

  mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      reportId: row.report_id,
      cronExpression: row.cron_expression,
      timezone: row.timezone,
      isActive: row.is_active,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
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

    if (data.cronExpression !== undefined) row.cron_expression = data.cronExpression;
    if (data.timezone !== undefined) row.timezone = data.timezone;
    if (data.isActive !== undefined) row.is_active = data.isActive;
    if (data.lastRunAt !== undefined) row.last_run_at = data.lastRunAt;
    if (data.nextRunAt !== undefined) row.next_run_at = data.nextRunAt;

    return row;
  }

  /**
   * Find job by report
   */
  async findByReportId(reportId) {
    await this.init();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('report_id', reportId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapRow(data);
  }

  /**
   * Find all active jobs
   */
  async findActive() {
    return this.findAll({ filters: { is_active: true } });
  }

  /**
   * Activate/deactivate job
   */
  async setActive(jobId, isActive) {
    return this.update(jobId, { isActive });
  }

  /**
   * Update job run timestamps
   */
  async updateRunTimes(jobId, lastRunAt, nextRunAt) {
    return this.update(jobId, { lastRunAt, nextRunAt });
  }

  /**
   * Delete job by report ID
   */
  async deleteByReportId(reportId) {
    await this.init();

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('report_id', reportId);

    if (error) throw error;
    return true;
  }
}

export const scheduledJobRepository = new ScheduledJobRepository();
