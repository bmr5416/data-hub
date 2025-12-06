/**
 * Vercel Cron Job - Scheduled Report Delivery
 *
 * Triggered by Vercel Cron every hour (0 * * * *)
 * Processes all reports that are due for delivery
 */

import { supabaseService } from '../../server/services/supabase.js';
import { reportService } from '../../server/services/reportService.js';

/**
 * Vercel Cron handler for processing scheduled report deliveries
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
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get all scheduled reports that are due
    const dueReports = await supabaseService.getScheduledReportsDue();

    results.processed = dueReports.length;

    // Process each due report
    for (const report of dueReports) {
      if (!report.isScheduled) {
        results.skipped++;
        continue;
      }

      try {
        const result = await reportService.processScheduledDelivery(report.id);

        if (result.skipped) {
          results.skipped++;
        } else {
          results.succeeded++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          reportId: report.id,
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
