/**
 * Vercel Cron Job - Alert Evaluation
 *
 * Triggered by Vercel Cron every 15 minutes (* /15 * * * *)
 * Evaluates all active alerts for threshold breaches
 */

import { supabaseService } from '../../server/services/supabase.js';

/**
 * Vercel Cron handler for evaluating alerts
 */
export default async function handler(req, res) {
  // Verify this is a cron request from Vercel
  const userAgent = req.headers['user-agent'] || '';
  const isVercelCron = userAgent === 'vercel-cron/1.0';

  // Also allow manual triggers with a secret (for testing)
  const cronSecret = req.headers['x-cron-secret'];
  const hasValidSecret = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isVercelCron && !hasValidSecret) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'This endpoint can only be called by Vercel Cron',
    });
  }

  const startTime = Date.now();
  const results = {
    alertsChecked: 0,
    triggered: 0,
    errors: [],
  };

  try {
    // Get all active report alerts
    const alerts = await supabaseService.getAllActiveAlerts();

    results.alertsChecked = alerts?.length || 0;

    // Evaluate each alert
    for (const alert of alerts || []) {
      try {
        // Evaluate the alert based on its type
        const triggered = await evaluateAlert(alert);

        if (triggered) {
          results.triggered++;

          // Log alert trigger to history
          await supabaseService.createReportAlertHistory({
            alertId: alert.id,
            reportId: alert.reportId,
            alertType: alert.alertType,
            triggered: true,
            message: `Alert triggered: ${alert.alertType}`,
            evaluatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        results.errors.push({
          alertId: alert.id,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      results,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error.message,
      results,
    });
  }
}

/**
 * Evaluate a single alert based on its type
 */
async function evaluateAlert(alert) {
  const config = alert.config || {};

  switch (alert.alertType) {
    case 'metric_threshold':
      return evaluateMetricThreshold(alert, config);

    case 'trend_detection':
      return evaluateTrendDetection(alert, config);

    case 'data_freshness':
      return evaluateDataFreshness(alert, config);

    default:
      return false;
  }
}

/**
 * Evaluate metric threshold alert
 */
async function evaluateMetricThreshold(_alert, _config) {
  // This would need access to actual report data
  // For now, return false (not triggered)
  // Full implementation would query warehouse data
  return false;
}

/**
 * Evaluate trend detection alert
 */
async function evaluateTrendDetection(_alert, _config) {
  // This would compare current vs previous period
  // For now, return false (not triggered)
  return false;
}

/**
 * Evaluate data freshness alert
 */
async function evaluateDataFreshness(_alert, _config) {
  // Check when data was last updated
  // This would need to query platform_uploads or similar
  // For now, return false (not triggered)
  return false;
}
