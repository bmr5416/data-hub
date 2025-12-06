/**
 * Unified Daily Cron Job for Vercel Hobby Tier
 *
 * Processes both scheduled reports AND alert evaluation in one execution.
 * Runs once daily at 9:00 AM UTC.
 *
 * PRO TIER UPGRADE: Switch vercel.json to use separate endpoints:
 *   - /api/cron/reports (hourly: "0 * * * *")
 *   - /api/cron/alerts (15-min: "*/15 * * * *")
 */

import { supabaseService } from '../../server/services/supabase.js';
import { reportService } from '../../server/services/reportService.js';

/**
 * Vercel Cron handler for unified daily processing
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
    reports: { processed: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] },
    alerts: { checked: 0, triggered: 0, errors: [] },
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: Process Scheduled Reports
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const dueReports = await supabaseService.getScheduledReportsDue();
    results.reports.processed = dueReports.length;

    for (const report of dueReports) {
      if (!report.isScheduled) {
        results.reports.skipped++;
        continue;
      }

      try {
        const result = await reportService.processScheduledDelivery(report.id);

        if (result.skipped) {
          results.reports.skipped++;
        } else {
          results.reports.succeeded++;
        }
      } catch (error) {
        results.reports.failed++;
        results.reports.errors.push({
          reportId: report.id,
          error: error.message,
        });
      }
    }
  } catch (error) {
    results.reports.errors.push({
      phase: 'fetch',
      error: error.message,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: Evaluate Alerts
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await supabaseService.getAllActiveAlerts();
    results.alerts.checked = alerts?.length || 0;

    for (const alert of alerts || []) {
      try {
        const triggered = await evaluateAlert(alert);

        if (triggered) {
          results.alerts.triggered++;

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
        results.alerts.errors.push({
          alertId: alert.id,
          error: error.message,
        });
      }
    }
  } catch (error) {
    results.alerts.errors.push({
      phase: 'fetch',
      error: error.message,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Return Combined Results
  // ─────────────────────────────────────────────────────────────────────────────
  const duration = Date.now() - startTime;
  const hasErrors =
    results.reports.errors.length > 0 || results.alerts.errors.length > 0;

  return res.status(hasErrors ? 207 : 200).json({
    success: !hasErrors,
    tier: 'hobby',
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    results,
  });
}

/**
 * Evaluate a single alert based on its type
 * (Same implementation as alerts.js)
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
