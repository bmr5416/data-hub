/**
 * Alert Evaluator Service
 *
 * Evaluates KPI values against alert thresholds and logs triggered alerts.
 */

import { kpiRepository, kpiAlertRepository } from './repositories/index.js';

/**
 * Alert condition evaluation functions
 */
const ALERT_CONDITIONS = {
  above_threshold: (value, threshold) => value > threshold,
  below_threshold: (value, threshold) => value < threshold,
  equals: (value, threshold) => value === threshold,
  percent_change: (value, threshold, baseline) => {
    if (!baseline || baseline === 0) return false;
    const percentChange = Math.abs((value - baseline) / baseline) * 100;
    return percentChange > threshold;
  },
};

/**
 * Generate alert message based on condition
 */
function generateAlertMessage(condition, value, threshold, kpiName) {
  const messages = {
    above_threshold: `KPI "${kpiName}" value ${value} exceeded threshold ${threshold}`,
    below_threshold: `KPI "${kpiName}" value ${value} dropped below threshold ${threshold}`,
    equals: `KPI "${kpiName}" value ${value} equals threshold ${threshold}`,
    percent_change: `KPI "${kpiName}" changed by more than ${threshold}% (current: ${value})`,
  };
  return messages[condition] || `KPI "${kpiName}" triggered alert (value: ${value})`;
}

/**
 * Evaluate all active alerts for a KPI
 *
 * @param {string} kpiId - The KPI ID to evaluate
 * @param {number} currentValue - The current KPI value
 * @param {number} [baseline] - Optional baseline for percent_change alerts
 * @returns {Object} Evaluation results
 */
async function evaluateKPIAlerts(kpiId, currentValue, baseline = null) {
  // Get the KPI details
  const kpi = await kpiRepository.findById(kpiId);
  if (!kpi) {
    throw new Error(`KPI ${kpiId} not found`);
  }

  // Get all active alerts for this KPI
  const alerts = await kpiAlertRepository.findByKpiId(kpiId);
  const activeAlerts = alerts.filter((alert) => alert.active);

  if (activeAlerts.length === 0) {
    return {
      kpiId,
      kpiName: kpi.name,
      currentValue,
      alertsChecked: 0,
      triggeredAlerts: [],
    };
  }

  const triggeredAlerts = [];

  for (const alert of activeAlerts) {
    const condition = ALERT_CONDITIONS[alert.condition];
    if (!condition) {
      continue; // Skip unknown conditions
    }

    let triggered = false;
    if (alert.condition === 'percent_change') {
      triggered = condition(currentValue, alert.threshold, baseline);
    } else {
      triggered = condition(currentValue, alert.threshold);
    }

    if (triggered) {
      const message = generateAlertMessage(
        alert.condition,
        currentValue,
        alert.threshold,
        kpi.name
      );

      // Log to alert history
      const historyEntry = await kpiAlertRepository.recordTrigger({
        alertId: alert.id,
        kpiId,
        actualValue: currentValue,
        threshold: alert.threshold,
        message,
      });

      triggeredAlerts.push({
        alertId: alert.id,
        condition: alert.condition,
        threshold: alert.threshold,
        message,
        historyId: historyEntry.id,
        channels: alert.channels,
        recipients: alert.recipients,
      });
    }
  }

  return {
    kpiId,
    kpiName: kpi.name,
    currentValue,
    alertsChecked: activeAlerts.length,
    triggeredAlerts,
    triggeredCount: triggeredAlerts.length,
  };
}

/**
 * Evaluate alerts for multiple KPIs in batch
 *
 * @param {Array<{kpiId: string, value: number}>} kpiValues - Array of KPI values
 * @returns {Array} Array of evaluation results
 */
async function evaluateMultipleKPIs(kpiValues) {
  const results = [];

  for (const { kpiId, value, baseline } of kpiValues) {
    try {
      const result = await evaluateKPIAlerts(kpiId, value, baseline);
      results.push(result);
    } catch (error) {
      results.push({
        kpiId,
        error: error.message,
      });
    }
  }

  return results;
}

export { evaluateKPIAlerts, evaluateMultipleKPIs, ALERT_CONDITIONS };
