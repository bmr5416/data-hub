/**
 * SchedulerService Unit Tests
 *
 * Comprehensive tests for server/services/schedulerService.js
 * Covers job scheduling, lifecycle management, and cron operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Use vi.hoisted() to ensure mocks are properly hoisted
const { mockCronTask, cronMock } = vi.hoisted(() => {
  const mockTask = {
    stop: vi.fn(),
  }
  return {
    mockCronTask: mockTask,
    cronMock: {
      schedule: vi.fn(() => mockTask),
      validate: vi.fn((expr: string) => {
        if (expr === 'invalid' || expr === 'invalid-cron') return false
        const parts = expr.split(' ')
        return parts.length === 5 || parts.length === 6
      }),
    },
  }
})

vi.mock('node-cron', () => ({
  default: cronMock,
}))

// Mock supabaseService
vi.mock('../../../server/services/supabase.js', () => ({
  supabaseService: {
    getScheduledJobs: vi.fn(),
    getScheduledJob: vi.fn(),
    getScheduledJobByEntity: vi.fn(),
    createScheduledJob: vi.fn(),
    updateScheduledJob: vi.fn(),
    deleteScheduledJob: vi.fn(),
    getScheduledReportsDue: vi.fn(),
  },
}))

// Mock reportService
vi.mock('../../../server/services/reportService.js', () => ({
  reportService: {
    processScheduledDelivery: vi.fn(),
  },
}))

// Mock logger
vi.mock('../../../server/utils/logger.js', () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

import { supabaseService } from '../../../server/services/supabase.js'
import { reportService } from '../../../server/services/reportService.js'
import { schedulerService } from '../../../server/services/schedulerService.js'

const mockedSupabase = vi.mocked(supabaseService)
const mockedReportService = vi.mocked(reportService)

describe('SchedulerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset scheduler state
    ;(schedulerService as any).jobs.clear()
    ;(schedulerService as any).isRunning = false
    ;(schedulerService as any).checkInterval = null
    mockCronTask.stop.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
    // Cleanup scheduler
    if ((schedulerService as any).checkInterval) {
      clearInterval((schedulerService as any).checkInterval)
      ;(schedulerService as any).checkInterval = null
    }
    ;(schedulerService as any).jobs.clear()
    ;(schedulerService as any).isRunning = false
  })

  // ============================================================
  // init()
  // ============================================================
  describe('init', () => {
    it('loads and schedules enabled jobs from database', async () => {
      const mockJobs = [
        { id: 'job-1', cronExpression: '0 9 * * *', jobType: 'report_delivery', entityId: 'report-1' },
        { id: 'job-2', cronExpression: '0 10 * * *', jobType: 'report_delivery', entityId: 'report-2' },
      ]
      mockedSupabase.getScheduledJobs.mockResolvedValue(mockJobs)
      mockedSupabase.getScheduledReportsDue.mockResolvedValue([])

      await schedulerService.init()

      // Verify database was queried for enabled jobs
      expect(mockedSupabase.getScheduledJobs).toHaveBeenCalledWith(null, true)
      // Verify jobs are tracked in the internal map
      expect((schedulerService as any).jobs.size).toBe(2)
      expect((schedulerService as any).jobs.has('job-1')).toBe(true)
      expect((schedulerService as any).jobs.has('job-2')).toBe(true)
      expect((schedulerService as any).isRunning).toBe(true)
    })

    it('skips jobs with invalid cron expressions', async () => {
      const mockJobs = [
        { id: 'job-1', cronExpression: '0 9 * * *', jobType: 'report_delivery' },
        { id: 'job-2', cronExpression: 'invalid', jobType: 'report_delivery' },
      ]
      mockedSupabase.getScheduledJobs.mockResolvedValue(mockJobs)
      mockedSupabase.getScheduledReportsDue.mockResolvedValue([])

      await schedulerService.init()

      // Only valid cron job should be scheduled
      expect((schedulerService as any).jobs.size).toBe(1)
      expect((schedulerService as any).jobs.has('job-1')).toBe(true)
      expect((schedulerService as any).jobs.has('job-2')).toBe(false)
    })

    it('starts the due job checker interval', async () => {
      mockedSupabase.getScheduledJobs.mockResolvedValue([])
      mockedSupabase.getScheduledReportsDue.mockResolvedValue([])

      await schedulerService.init()

      expect((schedulerService as any).checkInterval).toBeDefined()
    })

    it('does not reinitialize if already running', async () => {
      mockedSupabase.getScheduledJobs.mockResolvedValue([])
      mockedSupabase.getScheduledReportsDue.mockResolvedValue([]);

      (schedulerService as any).isRunning = true

      await schedulerService.init()

      expect(mockedSupabase.getScheduledJobs).not.toHaveBeenCalled()
    })

    it('throws error if database load fails', async () => {
      mockedSupabase.getScheduledJobs.mockRejectedValue(new Error('DB Error'))

      await expect(schedulerService.init()).rejects.toThrow('DB Error')
    })
  })

  // ============================================================
  // shutdown()
  // ============================================================
  describe('shutdown', () => {
    it('stops all scheduled jobs', async () => {
      // Setup with jobs
      ;(schedulerService as any).jobs.set('job-1', mockCronTask)
      ;(schedulerService as any).jobs.set('job-2', mockCronTask)
      ;(schedulerService as any).isRunning = true

      await schedulerService.shutdown()

      expect(mockCronTask.stop).toHaveBeenCalledTimes(2)
      expect((schedulerService as any).jobs.size).toBe(0)
    })

    it('clears the check interval', async () => {
      const intervalId = setInterval(() => {}, 60000)
      ;(schedulerService as any).checkInterval = intervalId
      ;(schedulerService as any).isRunning = true

      await schedulerService.shutdown()

      expect((schedulerService as any).checkInterval).toBeNull()
    })

    it('sets isRunning to false', async () => {
      ;(schedulerService as any).isRunning = true

      await schedulerService.shutdown()

      expect((schedulerService as any).isRunning).toBe(false)
    })
  })

  // ============================================================
  // scheduleJob() - private method
  // ============================================================
  describe('scheduleJob', () => {
    const mockJob = {
      id: 'job-1',
      cronExpression: '0 9 * * *',
      jobType: 'report_delivery',
      entityId: 'report-1',
    }

    it('creates cron task and adds to jobs map', () => {
      ;(schedulerService as any).scheduleJob(mockJob)

      // Verify job was added to internal map with a valid task object
      expect((schedulerService as any).jobs.has('job-1')).toBe(true)
      const task = (schedulerService as any).jobs.get('job-1')
      expect(task).toBeDefined()
      // The task should have a stop method (cron task interface)
      expect(typeof task.stop).toBe('function')
    })

    it('adds job to jobs map', () => {
      ;(schedulerService as any).scheduleJob(mockJob)

      expect((schedulerService as any).jobs.has('job-1')).toBe(true)
    })

    it('stops existing job before rescheduling', () => {
      // Add existing job
      ;(schedulerService as any).jobs.set('job-1', mockCronTask)

      // Schedule again (should stop previous)
      ;(schedulerService as any).scheduleJob(mockJob)

      expect(mockCronTask.stop).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================
  // executeJob() - private method
  // ============================================================
  describe('executeJob', () => {
    describe('report_delivery job type', () => {
      it('calls reportService.processScheduledDelivery', async () => {
        const job = { id: 'job-1', jobType: 'report_delivery', entityId: 'report-123' }
        mockedReportService.processScheduledDelivery.mockResolvedValue({
          success: true,
          recipients: ['test@example.com'],
        } as any)

        await (schedulerService as any).executeJob(job)

        expect(mockedReportService.processScheduledDelivery).toHaveBeenCalledWith('report-123')
      })

      it('handles skipped reports', async () => {
        const job = { id: 'job-1', jobType: 'report_delivery', entityId: 'report-123' }
        mockedReportService.processScheduledDelivery.mockResolvedValue({
          skipped: true,
          reason: 'not_scheduled',
        } as any)

        await expect((schedulerService as any).executeJob(job)).resolves.not.toThrow()
      })

      it('updates job status on failure', async () => {
        const job = { id: 'job-1', jobType: 'report_delivery', entityId: 'report-123' }
        mockedReportService.processScheduledDelivery.mockRejectedValue(new Error('Delivery failed'))

        await (schedulerService as any).executeJob(job)

        expect(mockedSupabase.updateScheduledJob).toHaveBeenCalledWith('job-1', {
          lastRunAt: expect.any(String),
          lastStatus: 'failed',
          lastError: 'Delivery failed',
        })
      })
    })

    describe('alert_evaluation job type', () => {
      it('updates job status after evaluation', async () => {
        const job = { id: 'job-1', jobType: 'alert_evaluation', entityId: 'global' }

        await (schedulerService as any).executeJob(job)

        expect(mockedSupabase.updateScheduledJob).toHaveBeenCalledWith('job-1', {
          lastRunAt: expect.any(String),
          lastStatus: 'success',
        })
      })
    })

    describe('unknown job type', () => {
      it('does not throw for unknown job type', async () => {
        const job = { id: 'job-1', jobType: 'unknown_type', entityId: 'entity-1' }

        await expect((schedulerService as any).executeJob(job)).resolves.not.toThrow()
      })
    })
  })

  // ============================================================
  // upsertJob()
  // ============================================================
  describe('upsertJob', () => {
    it('creates new job if not exists', async () => {
      mockedSupabase.getScheduledJobByEntity.mockResolvedValue(null)
      mockedSupabase.createScheduledJob.mockResolvedValue({
        id: 'new-job',
        jobType: 'report_delivery',
        entityId: 'report-1',
        cronExpression: '0 9 * * *',
      })

      const result = await schedulerService.upsertJob('report_delivery', 'report-1', '0 9 * * *')

      expect(mockedSupabase.createScheduledJob).toHaveBeenCalledWith({
        jobType: 'report_delivery',
        entityId: 'report-1',
        cronExpression: '0 9 * * *',
        enabled: true,
      })
      expect(result.id).toBe('new-job')
    })

    it('updates existing job if exists', async () => {
      mockedSupabase.getScheduledJobByEntity.mockResolvedValue({ id: 'existing-job' })
      mockedSupabase.updateScheduledJob.mockResolvedValue({
        id: 'existing-job',
        cronExpression: '0 10 * * *',
      })

      await schedulerService.upsertJob('report_delivery', 'report-1', '0 10 * * *')

      expect(mockedSupabase.updateScheduledJob).toHaveBeenCalledWith('existing-job', {
        cronExpression: '0 10 * * *',
        enabled: true,
      })
    })

    it('schedules the job after upsert', async () => {
      mockedSupabase.getScheduledJobByEntity.mockResolvedValue(null)
      mockedSupabase.createScheduledJob.mockResolvedValue({
        id: 'new-job',
        jobType: 'report_delivery',
        entityId: 'report-1',
        cronExpression: '0 9 * * *',
      })

      await schedulerService.upsertJob('report_delivery', 'report-1', '0 9 * * *')

      // Verify job was added to internal jobs map
      expect((schedulerService as any).jobs.has('new-job')).toBe(true)
    })

    it('throws for invalid cron expression', async () => {
      await expect(
        schedulerService.upsertJob('report_delivery', 'report-1', 'invalid-cron')
      ).rejects.toThrow('Invalid cron expression: invalid-cron')
    })
  })

  // ============================================================
  // removeJob()
  // ============================================================
  describe('removeJob', () => {
    it('stops cron task and removes from map', async () => {
      // Add job first
      ;(schedulerService as any).jobs.set('job-1', mockCronTask)

      await schedulerService.removeJob('job-1')

      expect(mockCronTask.stop).toHaveBeenCalled()
      expect((schedulerService as any).jobs.has('job-1')).toBe(false)
    })

    it('deletes job from database', async () => {
      await schedulerService.removeJob('job-1')

      expect(mockedSupabase.deleteScheduledJob).toHaveBeenCalledWith('job-1')
    })

    it('handles removing non-existent job gracefully', async () => {
      await expect(schedulerService.removeJob('non-existent')).resolves.not.toThrow()
      expect(mockedSupabase.deleteScheduledJob).toHaveBeenCalledWith('non-existent')
    })
  })

  // ============================================================
  // removeJobByEntity()
  // ============================================================
  describe('removeJobByEntity', () => {
    it('finds and removes job by entity', async () => {
      mockedSupabase.getScheduledJobByEntity.mockResolvedValue({ id: 'job-1' })
      ;(schedulerService as any).jobs.set('job-1', mockCronTask)

      await schedulerService.removeJobByEntity('report_delivery', 'report-1')

      expect(mockedSupabase.getScheduledJobByEntity).toHaveBeenCalledWith('report_delivery', 'report-1')
      expect(mockedSupabase.deleteScheduledJob).toHaveBeenCalledWith('job-1')
    })

    it('does nothing if job not found', async () => {
      mockedSupabase.getScheduledJobByEntity.mockResolvedValue(null)

      await schedulerService.removeJobByEntity('report_delivery', 'non-existent')

      expect(mockedSupabase.deleteScheduledJob).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // pauseJob()
  // ============================================================
  describe('pauseJob', () => {
    it('stops cron task', async () => {
      ;(schedulerService as any).jobs.set('job-1', mockCronTask)

      await schedulerService.pauseJob('job-1')

      expect(mockCronTask.stop).toHaveBeenCalled()
    })

    it('updates job to disabled in database', async () => {
      await schedulerService.pauseJob('job-1')

      expect(mockedSupabase.updateScheduledJob).toHaveBeenCalledWith('job-1', {
        enabled: false,
      })
    })
  })

  // ============================================================
  // resumeJob()
  // ============================================================
  describe('resumeJob', () => {
    it('throws if job not found', async () => {
      mockedSupabase.getScheduledJob.mockResolvedValue(null)

      await expect(schedulerService.resumeJob('non-existent')).rejects.toThrow('Job non-existent not found')
    })

    it('enables job and reschedules', async () => {
      mockedSupabase.getScheduledJob.mockResolvedValue({
        id: 'job-1',
        cronExpression: '0 9 * * *',
        jobType: 'report_delivery',
      })

      await schedulerService.resumeJob('job-1')

      // Verify database was updated to enable job
      expect(mockedSupabase.updateScheduledJob).toHaveBeenCalledWith('job-1', {
        enabled: true,
      })
      // Verify job was added to internal jobs map (scheduled)
      expect((schedulerService as any).jobs.has('job-1')).toBe(true)
    })
  })

  // ============================================================
  // getJobStatuses()
  // ============================================================
  describe('getJobStatuses', () => {
    it('returns status for all jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          jobType: 'report_delivery',
          entityId: 'report-1',
          cronExpression: '0 9 * * *',
          enabled: true,
          lastRunAt: '2024-01-20T09:00:00Z',
          lastStatus: 'success',
          lastError: null,
          nextRunAt: '2024-01-21T09:00:00Z',
        },
        {
          id: 'job-2',
          jobType: 'alert_evaluation',
          entityId: 'global',
          cronExpression: '*/15 * * * *',
          enabled: false,
          lastRunAt: null,
          lastStatus: null,
          lastError: null,
          nextRunAt: null,
        },
      ]
      mockedSupabase.getScheduledJobs.mockResolvedValue(mockJobs)

      const statuses = await schedulerService.getJobStatuses()

      expect(statuses).toHaveLength(2)
      expect(statuses[0]).toMatchObject({
        id: 'job-1',
        type: 'report_delivery',
        entityId: 'report-1',
        enabled: true,
        lastStatus: 'success',
      })
    })

    it('indicates active status from jobs map', async () => {
      // Add job-1 to active jobs
      ;(schedulerService as any).jobs.set('job-1', mockCronTask)

      mockedSupabase.getScheduledJobs.mockResolvedValue([
        { id: 'job-1', jobType: 'report_delivery', entityId: 'report-1', cronExpression: '0 9 * * *', enabled: true },
        { id: 'job-2', jobType: 'report_delivery', entityId: 'report-2', cronExpression: '0 10 * * *', enabled: true },
      ])

      const statuses = await schedulerService.getJobStatuses()

      expect(statuses.find(s => s.id === 'job-1')?.isActive).toBe(true)
      expect(statuses.find(s => s.id === 'job-2')?.isActive).toBe(false)
    })
  })

  // ============================================================
  // triggerJob()
  // ============================================================
  describe('triggerJob', () => {
    it('throws if job not found', async () => {
      mockedSupabase.getScheduledJob.mockResolvedValue(null)

      await expect(schedulerService.triggerJob('non-existent')).rejects.toThrow('Job non-existent not found')
    })

    it('executes the job immediately', async () => {
      mockedSupabase.getScheduledJob.mockResolvedValue({
        id: 'job-1',
        jobType: 'report_delivery',
        entityId: 'report-1',
      })
      mockedReportService.processScheduledDelivery.mockResolvedValue({ success: true } as any)

      await schedulerService.triggerJob('job-1')

      expect(mockedReportService.processScheduledDelivery).toHaveBeenCalledWith('report-1')
    })
  })

  // ============================================================
  // createAlertEvaluationJob()
  // ============================================================
  describe('createAlertEvaluationJob', () => {
    it('creates global alert job if not exists', async () => {
      mockedSupabase.getScheduledJobByEntity.mockResolvedValue(null)
      mockedSupabase.createScheduledJob.mockResolvedValue({
        id: 'alert-job',
        jobType: 'alert_evaluation',
        entityId: 'global',
        cronExpression: '*/15 * * * *',
      })

      await schedulerService.createAlertEvaluationJob()

      expect(mockedSupabase.createScheduledJob).toHaveBeenCalledWith({
        jobType: 'alert_evaluation',
        entityId: 'global',
        cronExpression: '*/15 * * * *',
        enabled: true,
      })
    })

    it('does not create if already exists', async () => {
      mockedSupabase.getScheduledJobByEntity.mockResolvedValue({
        id: 'existing-alert-job',
      })

      await schedulerService.createAlertEvaluationJob()

      expect(mockedSupabase.createScheduledJob).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // checkDueJobs() - private method
  // ============================================================
  describe('checkDueJobs', () => {
    it('processes due reports', async () => {
      mockedSupabase.getScheduledReportsDue.mockResolvedValue([
        { id: 'report-1', isScheduled: true },
        { id: 'report-2', isScheduled: true },
      ])
      mockedReportService.processScheduledDelivery.mockResolvedValue({ success: true } as any)

      await (schedulerService as any).checkDueJobs()

      expect(mockedReportService.processScheduledDelivery).toHaveBeenCalledTimes(2)
    })

    it('skips unscheduled reports', async () => {
      mockedSupabase.getScheduledReportsDue.mockResolvedValue([
        { id: 'report-1', isScheduled: false },
      ])

      await (schedulerService as any).checkDueJobs()

      expect(mockedReportService.processScheduledDelivery).not.toHaveBeenCalled()
    })

    it('continues processing on individual report failure', async () => {
      mockedSupabase.getScheduledReportsDue.mockResolvedValue([
        { id: 'report-1', isScheduled: true },
        { id: 'report-2', isScheduled: true },
      ])
      mockedReportService.processScheduledDelivery
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ success: true } as any)

      await (schedulerService as any).checkDueJobs()

      expect(mockedReportService.processScheduledDelivery).toHaveBeenCalledTimes(2)
    })

    it('handles database error gracefully', async () => {
      mockedSupabase.getScheduledReportsDue.mockRejectedValue(new Error('DB Error'))

      await expect((schedulerService as any).checkDueJobs()).resolves.not.toThrow()
    })
  })
})
