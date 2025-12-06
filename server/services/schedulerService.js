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
import { scheduledJobRepository, reportRepository } from './repositories/index.js';
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
    const jobs = await scheduledJobRepository.findActive();

    for (const job of jobs) {
      if (job.cronExpression && cron.validate(job.cronExpression)) {
        // Map repository fields to scheduler expected format
        const schedulerJob = {
          ...job,
          jobType: 'report_delivery',
          entityId: job.reportId,
          enabled: job.isActive,
        };
        this.scheduleJob(schedulerJob);
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
      await scheduledJobRepository.update(job.id, {
        lastRunAt: new Date().toISOString(),
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
    await scheduledJobRepository.update(job.id, {
      lastRunAt: new Date().toISOString(),
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
      const dueReports = await reportRepository.findScheduledDue();

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
   * @param {string} entityId - Associated entity ID (reportId for report_delivery)
   * @param {string} cronExpression - Cron expression for scheduling
   * @returns {Object} Created/updated job
   */
  async upsertJob(jobType, entityId, cronExpression) {
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // For report_delivery, entityId is the reportId
    const existingJob = jobType === 'report_delivery'
      ? await scheduledJobRepository.findByReportId(entityId)
      : null;

    let job;
    if (existingJob) {
      // Update existing job
      job = await scheduledJobRepository.update(existingJob.id, {
        cronExpression,
        isActive: true,
      });
    } else {
      // Create new job
      job = await scheduledJobRepository.create({
        reportId: entityId,
        cronExpression,
        isActive: true,
      });
    }

    // Map to scheduler format and schedule the job
    const schedulerJob = {
      ...job,
      jobType,
      entityId,
      enabled: job.isActive,
    };
    this.scheduleJob(schedulerJob);

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
    await scheduledJobRepository.delete(jobId);

    log.info(`Removed job ${jobId}`, { jobId });
  }

  /**
   * Remove a scheduled job by entity
   *
   * @param {string} jobType - Job type
   * @param {string} entityId - Entity ID (reportId for report_delivery)
   */
  async removeJobByEntity(jobType, entityId) {
    const job = jobType === 'report_delivery'
      ? await scheduledJobRepository.findByReportId(entityId)
      : null;

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

    await scheduledJobRepository.setActive(jobId, false);

    log.info(`Paused job ${jobId}`, { jobId });
  }

  /**
   * Resume a paused job
   *
   * @param {string} jobId - Job ID to resume
   */
  async resumeJob(jobId) {
    const job = await scheduledJobRepository.findById(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await scheduledJobRepository.setActive(jobId, true);

    // Map to scheduler format and re-schedule the job
    const schedulerJob = {
      ...job,
      jobType: 'report_delivery',
      entityId: job.reportId,
      enabled: true,
    };
    this.scheduleJob(schedulerJob);

    log.info(`Resumed job ${jobId}`, { jobId });
  }

  /**
   * Get status of all scheduled jobs
   *
   * @returns {Array} Array of job statuses
   */
  async getJobStatuses() {
    const jobs = await scheduledJobRepository.findAll();

    return jobs.map((job) => ({
      id: job.id,
      type: 'report_delivery',
      entityId: job.reportId,
      cronExpression: job.cronExpression,
      enabled: job.isActive,
      lastRunAt: job.lastRunAt,
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
    const job = await scheduledJobRepository.findById(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Map to scheduler format
    const schedulerJob = {
      ...job,
      jobType: 'report_delivery',
      entityId: job.reportId,
      enabled: job.isActive,
    };

    return this.executeJob(schedulerJob);
  }

  /**
   * Create the default alert evaluation job
   * Runs every 15 minutes to evaluate all active alerts
   *
   * Note: Alert evaluation jobs are not currently supported by the repository pattern.
   * This method is a placeholder for future implementation.
   */
  async createAlertEvaluationJob() {
    // Alert evaluation jobs would need a separate job table or generic entity support
    // For now, alert evaluation is handled by the checkDueJobs mechanism
    log.info('Alert evaluation job creation is handled via scheduled reports');
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
export default schedulerService;
