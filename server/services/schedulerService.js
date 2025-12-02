/**
 * SchedulerService - Manages scheduled jobs using node-cron
 *
 * Handles:
 * - Report delivery scheduling
 * - Alert evaluation scheduling
 * - Job persistence and recovery
 * - Dynamic schedule updates
 */

import cron from 'node-cron';
import { supabaseService } from './supabase.js';
import { reportService } from './reportService.js';
import logger from '../utils/logger.js';
// Alert service will be imported when created
// import { alertService } from './alertService.js';

// Create a child logger for the scheduler component
const log = logger.child({ component: 'Scheduler' });

class SchedulerService {
  constructor() {
    this.jobs = new Map(); // Map of jobId -> cron task
    this.isRunning = false;
    this.checkInterval = null;
    // Default timezone - can be overridden via environment variable
    this.defaultTimezone = process.env.SCHEDULER_TIMEZONE || 'America/New_York';
  }

  /**
   * Initialize the scheduler service
   * Loads scheduled jobs from database and starts cron tasks
   */
  async init() {
    if (this.isRunning) {
      log.warn('SchedulerService is already running');
      return;
    }

    log.info('Initializing scheduler service...');

    try {
      // Load all enabled jobs from database
      await this.loadScheduledJobs();

      // Start the due job checker (runs every minute)
      this.startDueJobChecker();

      this.isRunning = true;
      log.info(`Started with ${this.jobs.size} active jobs`, { jobCount: this.jobs.size });
    } catch (error) {
      log.error('Failed to initialize', { error: error.message });
      throw error;
    }
  }

  /**
   * Gracefully shutdown the scheduler
   */
  async shutdown() {
    log.info('Shutting down...');

    // Stop the due job checker
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Stop all cron jobs
    for (const [jobId, task] of this.jobs.entries()) {
      try {
        task.stop();
        log.info(`Stopped job ${jobId}`, { jobId });
      } catch (error) {
        log.error(`Error stopping job ${jobId}`, { jobId, error: error.message });
      }
    }

    this.jobs.clear();
    this.isRunning = false;
    log.info('Shutdown complete');
  }

  /**
   * Load scheduled jobs from database
   */
  async loadScheduledJobs() {
    const jobs = await supabaseService.getScheduledJobs(null, true);

    for (const job of jobs) {
      if (job.cronExpression && cron.validate(job.cronExpression)) {
        this.scheduleJob(job);
      } else {
        log.warn(`Invalid cron expression for job ${job.id}`, { jobId: job.id, cronExpression: job.cronExpression });
      }
    }
  }

  /**
   * Schedule a job using node-cron
   *
   * @param {Object} job - Job configuration from database
   */
  scheduleJob(job) {
    // Stop existing job if it exists
    if (this.jobs.has(job.id)) {
      this.jobs.get(job.id).stop();
    }

    const task = cron.schedule(job.cronExpression, async () => {
      await this.executeJob(job);
    }, {
      scheduled: true,
      timezone: this.defaultTimezone,
    });

    this.jobs.set(job.id, task);
    log.info(`Scheduled job ${job.id}`, { jobId: job.id, jobType: job.jobType, cronExpression: job.cronExpression });
  }

  /**
   * Execute a scheduled job
   *
   * @param {Object} job - Job to execute
   */
  async executeJob(job) {
    log.info(`Executing job ${job.id}`, { jobId: job.id, jobType: job.jobType });

    try {
      switch (job.jobType) {
        case 'report_delivery':
          await this.executeReportDelivery(job);
          break;

        case 'alert_evaluation':
          await this.executeAlertEvaluation(job);
          break;

        default:
          log.warn(`Unknown job type: ${job.jobType}`, { jobType: job.jobType });
      }
    } catch (error) {
      log.error(`Job ${job.id} failed`, { jobId: job.id, error: error.message });

      // Update job with error status
      await supabaseService.updateScheduledJob(job.id, {
        lastRunAt: new Date().toISOString(),
        lastStatus: 'failed',
        lastError: error.message,
      });
    }
  }

  /**
   * Execute report delivery job
   */
  async executeReportDelivery(job) {
    const reportId = job.entityId;

    try {
      const result = await reportService.processScheduledDelivery(reportId);

      if (result.skipped) {
        log.info(`Report ${reportId} skipped`, { reportId, reason: result.reason });
        return;
      }

      log.info(`Report ${reportId} sent successfully`, { reportId, recipientCount: result.recipients?.length || 0 });
    } catch (error) {
      log.error(`Report delivery failed for ${reportId}`, { reportId, error: error.message });
      throw error;
    }
  }

  /**
   * Execute alert evaluation job
   */
  async executeAlertEvaluation(job) {
    // This will be implemented when AlertService is created
    // For now, log that we would evaluate alerts
    log.info(`Would evaluate alerts for entity ${job.entityId}`, { entityId: job.entityId });

    // Update job status
    await supabaseService.updateScheduledJob(job.id, {
      lastRunAt: new Date().toISOString(),
      lastStatus: 'success',
    });
  }

  /**
   * Start the due job checker
   * Runs every minute to check for jobs that are due
   * This is a backup mechanism in case cron jobs don't fire
   */
  startDueJobChecker() {
    // Check every minute for due jobs
    this.checkInterval = setInterval(async () => {
      await this.checkDueJobs();
    }, 60000);

    // Also run immediately on startup
    this.checkDueJobs().catch((err) => {
      log.error('Error checking due jobs', { error: err.message });
    });
  }

  /**
   * Check for and process any jobs that are past due
   */
  async checkDueJobs() {
    try {
      // Get scheduled reports that are due
      const dueReports = await supabaseService.getScheduledReportsDue();

      for (const report of dueReports) {
        if (!report.isScheduled) continue;

        log.info(`Processing due report: ${report.id}`, { reportId: report.id });

        try {
          await reportService.processScheduledDelivery(report.id);
        } catch (error) {
          log.error(`Failed to process report ${report.id}`, { reportId: report.id, error: error.message });
        }
      }
    } catch (error) {
      log.error('Error checking due jobs', { error: error.message });
    }
  }

  /**
   * Add or update a scheduled job
   *
   * @param {string} jobType - Type of job (report_delivery, alert_evaluation)
   * @param {string} entityId - Associated entity ID
   * @param {string} cronExpression - Cron expression for scheduling
   * @returns {Object} Created/updated job
   */
  async upsertJob(jobType, entityId, cronExpression) {
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Check if job already exists
    const existingJob = await supabaseService.getScheduledJobByEntity(jobType, entityId);

    let job;
    if (existingJob) {
      // Update existing job
      job = await supabaseService.updateScheduledJob(existingJob.id, {
        cronExpression,
        enabled: true,
      });
    } else {
      // Create new job
      job = await supabaseService.createScheduledJob({
        jobType,
        entityId,
        cronExpression,
        enabled: true,
      });
    }

    // Schedule the job
    this.scheduleJob(job);

    return job;
  }

  /**
   * Remove a scheduled job
   *
   * @param {string} jobId - Job ID to remove
   */
  async removeJob(jobId) {
    // Stop cron task
    if (this.jobs.has(jobId)) {
      this.jobs.get(jobId).stop();
      this.jobs.delete(jobId);
    }

    // Delete from database
    await supabaseService.deleteScheduledJob(jobId);

    log.info(`Removed job ${jobId}`, { jobId });
  }

  /**
   * Remove a scheduled job by entity
   *
   * @param {string} jobType - Job type
   * @param {string} entityId - Entity ID
   */
  async removeJobByEntity(jobType, entityId) {
    const job = await supabaseService.getScheduledJobByEntity(jobType, entityId);

    if (job) {
      await this.removeJob(job.id);
    }
  }

  /**
   * Pause a scheduled job
   *
   * @param {string} jobId - Job ID to pause
   */
  async pauseJob(jobId) {
    if (this.jobs.has(jobId)) {
      this.jobs.get(jobId).stop();
    }

    await supabaseService.updateScheduledJob(jobId, {
      enabled: false,
    });

    log.info(`Paused job ${jobId}`, { jobId });
  }

  /**
   * Resume a paused job
   *
   * @param {string} jobId - Job ID to resume
   */
  async resumeJob(jobId) {
    const job = await supabaseService.getScheduledJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await supabaseService.updateScheduledJob(jobId, {
      enabled: true,
    });

    // Re-schedule the job
    this.scheduleJob(job);

    log.info(`Resumed job ${jobId}`, { jobId });
  }

  /**
   * Get status of all scheduled jobs
   *
   * @returns {Array} Array of job statuses
   */
  async getJobStatuses() {
    const jobs = await supabaseService.getScheduledJobs(null, false);

    return jobs.map((job) => ({
      id: job.id,
      type: job.jobType,
      entityId: job.entityId,
      cronExpression: job.cronExpression,
      enabled: job.enabled,
      lastRunAt: job.lastRunAt,
      lastStatus: job.lastStatus,
      lastError: job.lastError,
      nextRunAt: job.nextRunAt,
      isActive: this.jobs.has(job.id),
    }));
  }

  /**
   * Manually trigger a job
   *
   * @param {string} jobId - Job ID to trigger
   * @returns {Object} Execution result
   */
  async triggerJob(jobId) {
    const job = await supabaseService.getScheduledJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return this.executeJob(job);
  }

  /**
   * Create the default alert evaluation job
   * Runs every 15 minutes to evaluate all active alerts
   */
  async createAlertEvaluationJob() {
    const existingJob = await supabaseService.getScheduledJobByEntity('alert_evaluation', 'global');

    if (!existingJob) {
      const job = await supabaseService.createScheduledJob({
        jobType: 'alert_evaluation',
        entityId: 'global',
        cronExpression: '*/15 * * * *', // Every 15 minutes
        enabled: true,
      });

      this.scheduleJob(job);
      log.info('Created global alert evaluation job');
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
export default schedulerService;
