/**
 * ReportAlertService - Evaluates and triggers report-level alerts
 *
 * Alert Types:
 * - metric_threshold: Triggers when a metric exceeds or falls below a threshold
 * - trend_detection: Triggers when a metric changes by more than X% period-over-period
 * - data_freshness: Triggers when data hasn't been updated within a time window
 */

import { supabaseService } from './supabase.js';
import { emailService } from './emailService.js';
import { reportService } from './reportService.js';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'AlertService' });

/**
 * Condition evaluation functions for metric thresholds
 */
const THRESHOLD_CONDITIONS = {
  gt: (value, threshold) => value > threshold,
  gte: (value, threshold) => value >= threshold,
  lt: (value, threshold) => value < threshold,
  lte: (value, threshold) => value <= threshold,
  eq: (value, threshold) => value === threshold,
  neq: (value, threshold) => value !== threshold,
};

/**
 * Human-readable condition labels
 */
const CONDITION_LABELS = {
  gt: 'greater than',
  gte: 'greater than or equal to',
  lt: 'less than',
  lte: 'less than or equal to',
  eq: 'equal to',
  neq: 'not equal to',
};

class ReportAlertService {
  /**
   * Evaluate all active alerts
   * Called periodically by the scheduler
   *
   * @returns {Object} Evaluation results
   */
  async evaluateAllAlerts() {
    const results = {
      evaluated: 0,
      triggered: 0,
      errors: 0,
      alerts: [],
    };

    try {
      // Get all active alerts
      const alerts = await supabaseService.getReportAlerts(null, true);

      for (const alert of alerts) {
        try {
          const result = await this.evaluateAlert(alert);
          results.evaluated++;

          if (result.triggered) {
            results.triggered++;
            results.alerts.push({
              alertId: alert.id,
              name: alert.name,
              triggered: true,
              message: result.message,
            });
          }
        } catch (error) {
          results.errors++;
          log.error(`Error evaluating alert ${alert.id}`, { alertId: alert.id, error: error.message });
        }
      }
    } catch (error) {
      log.error('Error getting alerts', { error: error.message });
      throw error;
    }

    return results;
  }

  /**
   * Evaluate a single alert
   *
   * @param {Object} alert - Alert configuration
   * @returns {Object} Evaluation result
   */
  async evaluateAlert(alert) {
    const result = {
      alertId: alert.id,
      triggered: false,
      message: null,
      actualValue: null,
      thresholdValue: null,
    };

    // Update last evaluated timestamp
    await supabaseService.updateReportAlert(alert.id, {
      lastEvaluatedAt: new Date().toISOString(),
    });

    switch (alert.alertType) {
      case 'metric_threshold':
        return this.evaluateMetricThreshold(alert);

      case 'trend_detection':
        return this.evaluateTrendDetection(alert);

      case 'data_freshness':
        return this.evaluateDataFreshness(alert);

      default:
        log.warn(`Unknown alert type: ${alert.alertType}`, { alertType: alert.alertType });
        return result;
    }
  }

  /**
   * Evaluate metric threshold alert
   */
  async evaluateMetricThreshold(alert) {
    const { metric, condition, threshold } = alert.config || {};

    if (!metric || !condition || threshold === undefined) {
      throw new Error('Invalid metric_threshold config: missing metric, condition, or threshold');
    }

    const conditionFn = THRESHOLD_CONDITIONS[condition];
    if (!conditionFn) {
      throw new Error(`Unknown condition: ${condition}`);
    }

    // Get report preview data to get current metric value
    const previewData = await reportService.getReportPreview(alert.reportId);
    const metricViz = previewData.visualizations.find(
      (v) => v.type === 'kpi' && v.config?.metric === metric
    );

    const actualValue = metricViz?.value ?? 0;
    const triggered = conditionFn(actualValue, threshold);

    const result = {
      alertId: alert.id,
      triggered,
      actualValue,
      thresholdValue: threshold,
      message: null,
    };

    if (triggered) {
      result.message = `${alert.name}: ${metric} is ${CONDITION_LABELS[condition]} ${threshold} (current: ${actualValue})`;

      await this.triggerAlert(alert, result);
    }

    return result;
  }

  /**
   * Evaluate trend detection alert
   */
  async evaluateTrendDetection(alert) {
    const { metric, changePercent, period = 'wow' } = alert.config || {};

    if (!metric || changePercent === undefined) {
      throw new Error('Invalid trend_detection config: missing metric or changePercent');
    }

    // Get report preview data
    const previewData = await reportService.getReportPreview(alert.reportId);
    const metricViz = previewData.visualizations.find(
      (v) => v.type === 'kpi' && v.config?.metric === metric
    );

    const trend = metricViz?.trend ?? 0;
    const triggered = Math.abs(trend) > changePercent;

    const result = {
      alertId: alert.id,
      triggered,
      actualValue: trend,
      thresholdValue: changePercent,
      message: null,
    };

    if (triggered) {
      const direction = trend > 0 ? 'increased' : 'decreased';
      const periodLabel = period === 'wow' ? 'week-over-week' : period === 'mom' ? 'month-over-month' : 'period-over-period';

      result.message = `${alert.name}: ${metric} has ${direction} by ${Math.abs(trend).toFixed(1)}% ${periodLabel} (threshold: ${changePercent}%)`;

      await this.triggerAlert(alert, result);
    }

    return result;
  }

  /**
   * Evaluate data freshness alert
   */
  async evaluateDataFreshness(alert) {
    const { maxHoursStale, platformId } = alert.config || {};

    if (!maxHoursStale) {
      throw new Error('Invalid data_freshness config: missing maxHoursStale');
    }

    // Get report to find warehouse
    const report = await supabaseService.getEnhancedReport(alert.reportId);
    if (!report?.warehouseId) {
      return {
        alertId: alert.id,
        triggered: false,
        message: 'No warehouse configured for report',
      };
    }

    // Get latest upload for the platform (or any platform)
    const uploads = await supabaseService.getClientUploads(report.clientId, platformId);
    const latestUpload = uploads[0]; // Already sorted by date desc

    const result = {
      alertId: alert.id,
      triggered: false,
      actualValue: null,
      thresholdValue: maxHoursStale,
      message: null,
    };

    if (!latestUpload) {
      result.triggered = true;
      result.message = `${alert.name}: No data uploads found`;
      await this.triggerAlert(alert, result);
      return result;
    }

    const uploadTime = new Date(latestUpload.uploadedAt);
    const hoursAgo = (Date.now() - uploadTime.getTime()) / (1000 * 60 * 60);

    result.actualValue = hoursAgo;
    result.triggered = hoursAgo > maxHoursStale;

    if (result.triggered) {
      result.message = `${alert.name}: Data is ${Math.round(hoursAgo)} hours old (threshold: ${maxHoursStale} hours)`;
      await this.triggerAlert(alert, result);
    }

    return result;
  }

  /**
   * Trigger an alert - send notifications and log history
   *
   * @param {Object} alert - Alert configuration
   * @param {Object} evaluationResult - Result from evaluation
   */
  async triggerAlert(alert, evaluationResult) {
    // Log to history
    await supabaseService.createReportAlertHistory({
      alertId: alert.id,
      reportId: alert.reportId,
      alertType: alert.alertType,
      actualValue: evaluationResult.actualValue,
      thresholdValue: evaluationResult.thresholdValue,
      message: evaluationResult.message,
      metadata: {
        triggeredAt: new Date().toISOString(),
      },
    });

    // Update alert last triggered timestamp
    await supabaseService.updateReportAlert(alert.id, {
      lastTriggeredAt: new Date().toISOString(),
    });

    // Send notifications via configured channels
    const recipients = alert.recipients || [];
    const channels = alert.channels || ['email'];

    if (channels.includes('email') && recipients.length > 0) {
      try {
        await emailService.sendAlertEmail({
          alert,
          alertData: {
            actualValue: evaluationResult.actualValue,
            thresholdValue: evaluationResult.thresholdValue,
            message: evaluationResult.message,
          },
          recipients,
        });
        log.info(`Sent alert email for ${alert.id}`, { alertId: alert.id, recipientCount: recipients.length });
      } catch (error) {
        log.error('Failed to send alert email', { alertId: alert.id, error: error.message });
      }
    }

    log.info(`Alert triggered: ${alert.name}`, { alertId: alert.id, alertName: alert.name, message: evaluationResult.message });
  }

  /**
   * Create a new alert for a report
   *
   * @param {Object} alertData - Alert configuration
   * @returns {Object} Created alert
   */
  async createAlert(alertData) {
    const {
      reportId,
      alertType,
      name,
      config,
      recipients,
      channels = ['email'],
    } = alertData;

    // Validate alert type
    const validTypes = ['metric_threshold', 'trend_detection', 'data_freshness'];
    if (!validTypes.includes(alertType)) {
      throw new Error(`Invalid alert type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate config based on type
    this.validateAlertConfig(alertType, config);

    const alert = await supabaseService.createReportAlert({
      reportId,
      alertType,
      name,
      config,
      recipients: recipients || [],
      channels,
      active: true,
    });

    return alert;
  }

  /**
   * Validate alert configuration
   */
  validateAlertConfig(alertType, config) {
    if (!config) {
      throw new Error('Alert config is required');
    }

    switch (alertType) {
      case 'metric_threshold':
        if (!config.metric) throw new Error('metric is required for metric_threshold alert');
        if (!config.condition) throw new Error('condition is required for metric_threshold alert');
        if (config.threshold === undefined) throw new Error('threshold is required for metric_threshold alert');
        if (!THRESHOLD_CONDITIONS[config.condition]) {
          throw new Error(`Invalid condition. Must be one of: ${Object.keys(THRESHOLD_CONDITIONS).join(', ')}`);
        }
        break;

      case 'trend_detection':
        if (!config.metric) throw new Error('metric is required for trend_detection alert');
        if (config.changePercent === undefined) throw new Error('changePercent is required for trend_detection alert');
        break;

      case 'data_freshness':
        if (config.maxHoursStale === undefined) throw new Error('maxHoursStale is required for data_freshness alert');
        break;
    }
  }

  /**
   * Update an existing alert
   *
   * @param {string} alertId - Alert ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated alert
   */
  async updateAlert(alertId, updates) {
    // If updating config, validate it
    if (updates.config) {
      const alert = await supabaseService.getReportAlert(alertId);
      if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
      }
      this.validateAlertConfig(updates.alertType || alert.alertType, updates.config);
    }

    return supabaseService.updateReportAlert(alertId, updates);
  }

  /**
   * Delete an alert
   *
   * @param {string} alertId - Alert ID
   * @returns {boolean} Success
   */
  async deleteAlert(alertId) {
    return supabaseService.deleteReportAlert(alertId);
  }

  /**
   * Get alerts for a report
   *
   * @param {string} reportId - Report ID
   * @returns {Array} Alerts
   */
  async getReportAlerts(reportId) {
    return supabaseService.getReportAlerts(reportId);
  }

  /**
   * Get alert history
   *
   * @param {string} alertId - Optional alert ID to filter
   * @param {number} limit - Max results
   * @returns {Array} Alert history
   */
  async getAlertHistory(alertId = null, limit = 100) {
    return supabaseService.getReportAlertHistory(alertId, limit);
  }

  /**
   * Toggle alert active status
   *
   * @param {string} alertId - Alert ID
   * @param {boolean} active - Active state
   * @returns {Object} Updated alert
   */
  async toggleAlert(alertId, active) {
    return supabaseService.updateReportAlert(alertId, { active });
  }

  /**
   * Test an alert by manually triggering it
   *
   * @param {string} alertId - Alert ID
   * @returns {Object} Test result
   */
  async testAlert(alertId) {
    const alert = await supabaseService.getReportAlert(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    // Force evaluation
    const result = await this.evaluateAlert(alert);

    return {
      alertId,
      alertName: alert.name,
      alertType: alert.alertType,
      wouldTrigger: result.triggered,
      message: result.message || 'Alert conditions not met',
      actualValue: result.actualValue,
      thresholdValue: result.thresholdValue,
    };
  }
}

// Export singleton instance
export const reportAlertService = new ReportAlertService();
export default reportAlertService;
