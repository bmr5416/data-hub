/**
 * Scheduler Database Service
 *
 * Database operations for scheduled jobs and report delivery history.
 */

import {
  getClient,
  generateId,
} from './BaseService.js';

// ========== SCHEDULED JOBS ==========

/**
 * Map scheduled job row
 */
function mapScheduledJobRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    jobType: row.job_type,
    entityId: row.entity_id,
    cronExpression: row.cron_expression,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    lastStatus: row.last_status,
    lastError: row.last_error,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get scheduled jobs
 */
export async function getScheduledJobs(jobType = null, enabledOnly = true) {
  const supabase = getClient();

  let query = supabase.from('scheduled_jobs').select('*');

  if (jobType) {
    query = query.eq('job_type', jobType);
  }
  if (enabledOnly) {
    query = query.eq('enabled', true);
  }

  query = query.order('next_run_at', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapScheduledJobRow);
}

/**
 * Get scheduled job by ID
 */
export async function getScheduledJob(jobId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapScheduledJobRow(data);
}

/**
 * Get scheduled job by entity
 */
export async function getScheduledJobByEntity(jobType, entityId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('job_type', jobType)
    .eq('entity_id', entityId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapScheduledJobRow(data);
}

/**
 * Create scheduled job
 */
export async function createScheduledJob(data) {
  const supabase = getClient();
  const jobId = generateId('job');

  const { data: job, error } = await supabase
    .from('scheduled_jobs')
    .insert({
      id: jobId,
      job_type: data.jobType,
      entity_id: data.entityId,
      cron_expression: data.cronExpression,
      next_run_at: data.nextRunAt,
      enabled: data.enabled !== false,
      last_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return mapScheduledJobRow(job);
}

/**
 * Update scheduled job
 */
export async function updateScheduledJob(jobId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.cronExpression !== undefined) updateData.cron_expression = data.cronExpression;
  if (data.nextRunAt !== undefined) updateData.next_run_at = data.nextRunAt;
  if (data.lastRunAt !== undefined) updateData.last_run_at = data.lastRunAt;
  if (data.lastStatus !== undefined) updateData.last_status = data.lastStatus;
  if (data.lastError !== undefined) updateData.last_error = data.lastError;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;

  const { data: job, error } = await supabase
    .from('scheduled_jobs')
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapScheduledJobRow(job);
}

/**
 * Delete scheduled job
 */
export async function deleteScheduledJob(jobId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('scheduled_jobs')
    .delete()
    .eq('id', jobId);

  if (error) throw error;
  return true;
}

/**
 * Delete scheduled job by entity
 */
export async function deleteScheduledJobByEntity(jobType, entityId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('scheduled_jobs')
    .delete()
    .eq('job_type', jobType)
    .eq('entity_id', entityId);

  if (error) throw error;
  return true;
}

// ========== REPORT DELIVERY HISTORY ==========

/**
 * Get report delivery history
 */
export async function getReportDeliveryHistory(reportId = null, limit = 50) {
  const supabase = getClient();

  let query = supabase
    .from('report_delivery_history')
    .select('*')
    .order('delivered_at', { ascending: false })
    .limit(limit);

  if (reportId) {
    query = query.eq('report_id', reportId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    reportId: row.report_id,
    deliveryFormat: row.delivery_format,
    recipients: row.recipients || [],
    status: row.status,
    errorMessage: row.error_message,
    fileSize: row.file_size,
    deliveredAt: row.delivered_at,
  }));
}

/**
 * Create report delivery history entry
 */
export async function createReportDeliveryHistory(data) {
  const supabase = getClient();
  const historyId = generateId('rdh');

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

  return {
    id: history.id,
    reportId: history.report_id,
    deliveryFormat: history.delivery_format,
    recipients: history.recipients,
    status: history.status,
    errorMessage: history.error_message,
    fileSize: history.file_size,
    deliveredAt: history.delivered_at,
  };
}

/**
 * Update report delivery history entry
 */
export async function updateReportDeliveryHistory(historyId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.errorMessage !== undefined) updateData.error_message = data.errorMessage;
  if (data.fileSize !== undefined) updateData.file_size = data.fileSize;

  const { data: history, error } = await supabase
    .from('report_delivery_history')
    .update(updateData)
    .eq('id', historyId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    id: history.id,
    reportId: history.report_id,
    deliveryFormat: history.delivery_format,
    recipients: history.recipients,
    status: history.status,
    errorMessage: history.error_message,
    fileSize: history.file_size,
    deliveredAt: history.delivered_at,
  };
}
