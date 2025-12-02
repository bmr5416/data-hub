/**
 * Alert Service
 *
 * Database operations for KPI alerts, report alerts, and alert history.
 */

import {
  getClient,
  generateId,
} from './BaseService.js';

// ========== KPI ALERTS ==========

/**
 * Map KPI alert row
 */
function mapKPIAlertRow(row) {
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

/**
 * Get KPI alerts
 */
export async function getKPIAlerts(kpiId = null) {
  const supabase = getClient();

  let query = supabase.from('kpi_alerts').select('*');
  if (kpiId) {
    query = query.eq('kpi_id', kpiId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapKPIAlertRow);
}

/**
 * Create KPI alert
 */
export async function createKPIAlert(data) {
  const supabase = getClient();
  const alertId = generateId('alert');

  const { data: alert, error } = await supabase
    .from('kpi_alerts')
    .insert({
      id: alertId,
      kpi_id: data.kpiId,
      condition: data.condition,
      threshold: data.threshold,
      channels: data.channels || [],
      recipients: data.recipients || [],
      active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return mapKPIAlertRow(alert);
}

/**
 * Update KPI alert
 */
export async function updateKPIAlert(alertId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.condition) updateData.condition = data.condition;
  if (data.threshold !== undefined) updateData.threshold = data.threshold;
  if (data.channels) updateData.channels = data.channels;
  if (data.recipients) updateData.recipients = data.recipients;
  if (data.active !== undefined) updateData.active = data.active;

  const { data: alert, error } = await supabase
    .from('kpi_alerts')
    .update(updateData)
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapKPIAlertRow(alert);
}

/**
 * Delete KPI alert
 */
export async function deleteKPIAlert(alertId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('kpi_alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw error;
  return true;
}

// ========== ALERT HISTORY ==========

/**
 * Get alert history
 */
export async function getAlertHistory(alertId = null, limit = 100) {
  const supabase = getClient();

  let query = supabase
    .from('alert_history')
    .select('*')
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (alertId) {
    query = query.eq('alert_id', alertId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    alertId: row.alert_id,
    kpiId: row.kpi_id,
    actualValue: parseFloat(row.actual_value),
    threshold: parseFloat(row.threshold),
    message: row.message,
    triggeredAt: row.triggered_at,
  }));
}

/**
 * Create alert history entry
 */
export async function createAlertHistory(data) {
  const supabase = getClient();
  const historyId = generateId('ah');

  const { data: history, error } = await supabase
    .from('alert_history')
    .insert({
      id: historyId,
      alert_id: data.alertId,
      kpi_id: data.kpiId,
      actual_value: data.actualValue,
      threshold: data.threshold,
      message: data.message,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: history.id,
    alertId: history.alert_id,
    kpiId: history.kpi_id,
    actualValue: parseFloat(history.actual_value),
    threshold: parseFloat(history.threshold),
    message: history.message,
    triggeredAt: history.triggered_at,
  };
}

// ========== REPORT ALERTS ==========

/**
 * Map report alert row
 */
function mapReportAlertRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    reportId: row.report_id,
    alertType: row.alert_type,
    name: row.name,
    config: row.config || {},
    recipients: row.recipients || [],
    channels: row.channels || ['email'],
    active: row.active,
    lastEvaluatedAt: row.last_evaluated_at,
    lastTriggeredAt: row.last_triggered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get report alerts
 */
export async function getReportAlerts(reportId = null, activeOnly = false) {
  const supabase = getClient();

  let query = supabase.from('report_alerts').select('*');

  if (reportId) {
    query = query.eq('report_id', reportId);
  }
  if (activeOnly) {
    query = query.eq('active', true);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapReportAlertRow);
}

/**
 * Get single report alert
 */
export async function getReportAlert(alertId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('report_alerts')
    .select('*')
    .eq('id', alertId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapReportAlertRow(data);
}

/**
 * Create report alert
 */
export async function createReportAlert(data) {
  const supabase = getClient();
  const alertId = generateId('ra');

  const { data: alert, error } = await supabase
    .from('report_alerts')
    .insert({
      id: alertId,
      report_id: data.reportId,
      alert_type: data.alertType,
      name: data.name,
      config: data.config,
      recipients: data.recipients || [],
      channels: data.channels || ['email'],
      active: data.active !== false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapReportAlertRow(alert);
}

/**
 * Update report alert
 */
export async function updateReportAlert(alertId, data) {
  const supabase = getClient();

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.alertType !== undefined) updateData.alert_type = data.alertType;
  if (data.config !== undefined) updateData.config = data.config;
  if (data.recipients !== undefined) updateData.recipients = data.recipients;
  if (data.channels !== undefined) updateData.channels = data.channels;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.lastEvaluatedAt !== undefined) updateData.last_evaluated_at = data.lastEvaluatedAt;
  if (data.lastTriggeredAt !== undefined) updateData.last_triggered_at = data.lastTriggeredAt;

  const { data: alert, error } = await supabase
    .from('report_alerts')
    .update(updateData)
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapReportAlertRow(alert);
}

/**
 * Delete report alert
 */
export async function deleteReportAlert(alertId) {
  const supabase = getClient();

  const { error } = await supabase
    .from('report_alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw error;
  return true;
}

// ========== REPORT ALERT HISTORY ==========

/**
 * Get report alert history
 */
export async function getReportAlertHistory(alertId = null, limit = 100) {
  const supabase = getClient();

  let query = supabase
    .from('report_alert_history')
    .select('*')
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (alertId) {
    query = query.eq('alert_id', alertId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    alertId: row.alert_id,
    reportId: row.report_id,
    alertType: row.alert_type,
    actualValue: row.actual_value ? parseFloat(row.actual_value) : null,
    thresholdValue: row.threshold_value ? parseFloat(row.threshold_value) : null,
    message: row.message,
    metadata: row.metadata || {},
    triggeredAt: row.triggered_at,
  }));
}

/**
 * Create report alert history entry
 */
export async function createReportAlertHistory(data) {
  const supabase = getClient();
  const historyId = generateId('rah');

  const { data: history, error } = await supabase
    .from('report_alert_history')
    .insert({
      id: historyId,
      alert_id: data.alertId,
      report_id: data.reportId,
      alert_type: data.alertType,
      actual_value: data.actualValue,
      threshold_value: data.thresholdValue,
      message: data.message,
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: history.id,
    alertId: history.alert_id,
    reportId: history.report_id,
    alertType: history.alert_type,
    actualValue: history.actual_value ? parseFloat(history.actual_value) : null,
    thresholdValue: history.threshold_value ? parseFloat(history.threshold_value) : null,
    message: history.message,
    metadata: history.metadata,
    triggeredAt: history.triggered_at,
  };
}
