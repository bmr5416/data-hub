/**
 * AlertEvaluator Unit Tests
 *
 * Comprehensive tests for server/services/alertEvaluator.js
 * Covers alert condition evaluation, message generation, and KPI alert processing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ALERT_CONDITIONS,
  evaluateKPIAlerts,
  evaluateMultipleKPIs,
} from '../../../server/services/alertEvaluator.js'

// Mock supabaseService
vi.mock('../../../server/services/supabase.js', () => ({
  supabaseService: {
    getKPI: vi.fn(),
    getKPIAlerts: vi.fn(),
    createAlertHistory: vi.fn(),
  },
}))

// Import mocked service for test control
import { supabaseService } from '../../../server/services/supabase.js'
const mockedSupabase = vi.mocked(supabaseService)

describe('AlertEvaluator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ============================================================
  // ALERT_CONDITIONS - Pure functions
  // ============================================================
  describe('ALERT_CONDITIONS', () => {
    describe('above_threshold', () => {
      it.each([
        { value: 100, threshold: 50, expected: true },
        { value: 100, threshold: 100, expected: false }, // equal is not above
        { value: 50, threshold: 100, expected: false },
        { value: 0.1, threshold: 0.05, expected: true },
        { value: -10, threshold: -20, expected: true }, // -10 > -20
        { value: -20, threshold: -10, expected: false },
      ])('returns $expected for value=$value, threshold=$threshold', ({ value, threshold, expected }) => {
        expect(ALERT_CONDITIONS.above_threshold(value, threshold)).toBe(expected)
      })

      it('handles boundary values', () => {
        expect(ALERT_CONDITIONS.above_threshold(100.001, 100)).toBe(true)
        expect(ALERT_CONDITIONS.above_threshold(99.999, 100)).toBe(false)
      })

      it('handles zero', () => {
        expect(ALERT_CONDITIONS.above_threshold(0, -1)).toBe(true)
        expect(ALERT_CONDITIONS.above_threshold(0, 0)).toBe(false)
        expect(ALERT_CONDITIONS.above_threshold(0, 1)).toBe(false)
      })
    })

    describe('below_threshold', () => {
      it.each([
        { value: 50, threshold: 100, expected: true },
        { value: 100, threshold: 100, expected: false }, // equal is not below
        { value: 100, threshold: 50, expected: false },
        { value: 0.05, threshold: 0.1, expected: true },
        { value: -20, threshold: -10, expected: true }, // -20 < -10
        { value: -10, threshold: -20, expected: false },
      ])('returns $expected for value=$value, threshold=$threshold', ({ value, threshold, expected }) => {
        expect(ALERT_CONDITIONS.below_threshold(value, threshold)).toBe(expected)
      })

      it('handles boundary values', () => {
        expect(ALERT_CONDITIONS.below_threshold(99.999, 100)).toBe(true)
        expect(ALERT_CONDITIONS.below_threshold(100.001, 100)).toBe(false)
      })

      it('handles zero', () => {
        expect(ALERT_CONDITIONS.below_threshold(0, 1)).toBe(true)
        expect(ALERT_CONDITIONS.below_threshold(0, 0)).toBe(false)
        expect(ALERT_CONDITIONS.below_threshold(0, -1)).toBe(false)
      })
    })

    describe('equals', () => {
      it.each([
        { value: 100, threshold: 100, expected: true },
        { value: 100, threshold: 50, expected: false },
        { value: 0, threshold: 0, expected: true },
        { value: -10, threshold: -10, expected: true },
        { value: 1.5, threshold: 1.5, expected: true },
      ])('returns $expected for value=$value, threshold=$threshold', ({ value, threshold, expected }) => {
        expect(ALERT_CONDITIONS.equals(value, threshold)).toBe(expected)
      })

      it('handles strict equality', () => {
        // JavaScript quirk: 0.1 + 0.2 !== 0.3
        expect(ALERT_CONDITIONS.equals(0.1 + 0.2, 0.3)).toBe(false) // floating point issue
        expect(ALERT_CONDITIONS.equals(0.3, 0.3)).toBe(true)
      })
    })

    describe('percent_change', () => {
      describe('valid baseline (non-zero)', () => {
        it.each([
          // 25% change from 100 to 125
          { value: 125, threshold: 20, baseline: 100, expected: true }, // 25% > 20%
          { value: 125, threshold: 30, baseline: 100, expected: false }, // 25% < 30%

          // 50% change from 100 to 50
          { value: 50, threshold: 40, baseline: 100, expected: true }, // 50% > 40%
          { value: 50, threshold: 60, baseline: 100, expected: false }, // 50% < 60%

          // Exactly at threshold
          { value: 120, threshold: 20, baseline: 100, expected: false }, // 20% is not > 20%

          // Small percentage
          { value: 101, threshold: 0.5, baseline: 100, expected: true }, // 1% > 0.5%

          // Negative to positive change
          { value: 50, threshold: 100, baseline: -50, expected: true }, // |(-50 - 50) / -50| * 100 = 200%
        ])('returns $expected for value=$value, threshold=$threshold, baseline=$baseline',
          ({ value, threshold, baseline, expected }) => {
            expect(ALERT_CONDITIONS.percent_change(value, threshold, baseline)).toBe(expected)
          }
        )
      })

      describe('zero baseline (divide-by-zero protection)', () => {
        it('returns false when baseline is 0', () => {
          expect(ALERT_CONDITIONS.percent_change(100, 10, 0)).toBe(false)
        })

        it('returns false when baseline is null', () => {
          expect(ALERT_CONDITIONS.percent_change(100, 10, null as any)).toBe(false)
        })

        it('returns false when baseline is undefined', () => {
          expect(ALERT_CONDITIONS.percent_change(100, 10, undefined as any)).toBe(false)
        })
      })

      describe('absolute value of change', () => {
        it('treats positive and negative changes equally', () => {
          // 20% increase
          expect(ALERT_CONDITIONS.percent_change(120, 15, 100)).toBe(true)
          // 20% decrease
          expect(ALERT_CONDITIONS.percent_change(80, 15, 100)).toBe(true)
        })
      })

      it('handles decimal thresholds', () => {
        // 5% change from 100 to 105
        expect(ALERT_CONDITIONS.percent_change(105, 4.5, 100)).toBe(true)
        expect(ALERT_CONDITIONS.percent_change(105, 5.5, 100)).toBe(false)
      })
    })
  })

  // ============================================================
  // evaluateKPIAlerts - with mocked Supabase
  // ============================================================
  describe('evaluateKPIAlerts', () => {
    const mockKPI = {
      id: 'kpi-123',
      name: 'Test KPI',
      clientId: 'client-456',
    }

    describe('KPI not found', () => {
      it('throws error when KPI does not exist', async () => {
        mockedSupabase.getKPI.mockResolvedValue(null)

        await expect(evaluateKPIAlerts('kpi-123', 100)).rejects.toThrow('KPI kpi-123 not found')
      })
    })

    describe('no active alerts', () => {
      it('returns empty triggered alerts when no alerts exist', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([])

        const result = await evaluateKPIAlerts('kpi-123', 100)

        expect(result.kpiId).toBe('kpi-123')
        expect(result.kpiName).toBe('Test KPI')
        expect(result.currentValue).toBe(100)
        expect(result.alertsChecked).toBe(0)
        expect(result.triggeredAlerts).toEqual([])
      })

      it('returns empty when all alerts are inactive', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'above_threshold', threshold: 50, active: false },
          { id: 'alert-2', condition: 'below_threshold', threshold: 200, active: false },
        ])

        const result = await evaluateKPIAlerts('kpi-123', 100)

        expect(result.alertsChecked).toBe(0)
        expect(result.triggeredAlerts).toEqual([])
      })
    })

    describe('alert triggering', () => {
      it('triggers above_threshold alert when condition is met', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          {
            id: 'alert-1',
            condition: 'above_threshold',
            threshold: 50,
            active: true,
            channels: ['email'],
            recipients: ['test@example.com'],
          },
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

        const result = await evaluateKPIAlerts('kpi-123', 100)

        expect(result.triggeredAlerts).toHaveLength(1)
        expect(result.triggeredAlerts[0].alertId).toBe('alert-1')
        expect(result.triggeredAlerts[0].condition).toBe('above_threshold')
        expect(result.triggeredAlerts[0].historyId).toBe('history-1')
        expect(result.triggeredAlerts[0].channels).toEqual(['email'])
        expect(result.triggeredAlerts[0].recipients).toEqual(['test@example.com'])
      })

      it('triggers below_threshold alert when condition is met', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'below_threshold', threshold: 150, active: true },
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

        const result = await evaluateKPIAlerts('kpi-123', 100)

        expect(result.triggeredAlerts).toHaveLength(1)
      })

      it('triggers equals alert when value matches threshold', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'equals', threshold: 100, active: true },
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

        const result = await evaluateKPIAlerts('kpi-123', 100)

        expect(result.triggeredAlerts).toHaveLength(1)
      })

      it('triggers percent_change alert with baseline', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'percent_change', threshold: 20, active: true },
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

        // 50% change from 100 to 150
        const result = await evaluateKPIAlerts('kpi-123', 150, 100)

        expect(result.triggeredAlerts).toHaveLength(1)
      })

      it('does not trigger percent_change without baseline', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'percent_change', threshold: 20, active: true },
        ])

        const result = await evaluateKPIAlerts('kpi-123', 150) // no baseline

        expect(result.triggeredAlerts).toHaveLength(0)
      })
    })

    describe('multiple alerts', () => {
      it('evaluates all active alerts and returns triggered ones', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'above_threshold', threshold: 50, active: true },
          { id: 'alert-2', condition: 'above_threshold', threshold: 200, active: true }, // not triggered
          { id: 'alert-3', condition: 'below_threshold', threshold: 200, active: true }, // triggered
          { id: 'alert-4', condition: 'above_threshold', threshold: 75, active: false }, // inactive
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-x' })

        const result = await evaluateKPIAlerts('kpi-123', 100)

        expect(result.alertsChecked).toBe(3) // only active alerts
        expect(result.triggeredAlerts).toHaveLength(2) // above 50 and below 200
        expect(result.triggeredCount).toBe(2)
      })

      it('creates history entry for each triggered alert', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'above_threshold', threshold: 50, active: true },
          { id: 'alert-2', condition: 'below_threshold', threshold: 200, active: true },
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-x' })

        await evaluateKPIAlerts('kpi-123', 100)

        expect(mockedSupabase.createAlertHistory).toHaveBeenCalledTimes(2)
      })
    })

    describe('unknown conditions', () => {
      it('skips alerts with unknown condition types', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'unknown_condition', threshold: 50, active: true },
          { id: 'alert-2', condition: 'above_threshold', threshold: 50, active: true },
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

        const result = await evaluateKPIAlerts('kpi-123', 100)

        expect(result.triggeredAlerts).toHaveLength(1)
        expect(result.triggeredAlerts[0].alertId).toBe('alert-2')
      })
    })

    describe('alert history creation', () => {
      it('creates history with correct payload', async () => {
        mockedSupabase.getKPI.mockResolvedValue(mockKPI)
        mockedSupabase.getKPIAlerts.mockResolvedValue([
          { id: 'alert-1', condition: 'above_threshold', threshold: 50, active: true },
        ])
        mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

        await evaluateKPIAlerts('kpi-123', 100)

        expect(mockedSupabase.createAlertHistory).toHaveBeenCalledWith({
          alertId: 'alert-1',
          kpiId: 'kpi-123',
          actualValue: 100,
          threshold: 50,
          message: expect.stringContaining('Test KPI'),
        })
      })
    })
  })

  // ============================================================
  // evaluateMultipleKPIs
  // ============================================================
  describe('evaluateMultipleKPIs', () => {
    const mockKPI1 = { id: 'kpi-1', name: 'KPI One' }
    const mockKPI2 = { id: 'kpi-2', name: 'KPI Two' }

    it('evaluates multiple KPIs and returns results', async () => {
      mockedSupabase.getKPI
        .mockResolvedValueOnce(mockKPI1)
        .mockResolvedValueOnce(mockKPI2)
      mockedSupabase.getKPIAlerts
        .mockResolvedValueOnce([{ id: 'alert-1', condition: 'above_threshold', threshold: 50, active: true }])
        .mockResolvedValueOnce([])
      mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

      const results = await evaluateMultipleKPIs([
        { kpiId: 'kpi-1', value: 100 },
        { kpiId: 'kpi-2', value: 50 },
      ])

      expect(results).toHaveLength(2)
      expect(results[0].kpiId).toBe('kpi-1')
      expect(results[0].triggeredAlerts).toHaveLength(1)
      expect(results[1].kpiId).toBe('kpi-2')
      expect(results[1].triggeredAlerts).toHaveLength(0)
    })

    it('handles errors for individual KPIs without stopping', async () => {
      mockedSupabase.getKPI
        .mockResolvedValueOnce(null) // KPI not found
        .mockResolvedValueOnce(mockKPI2)
      mockedSupabase.getKPIAlerts.mockResolvedValue([])

      const results = await evaluateMultipleKPIs([
        { kpiId: 'kpi-1', value: 100 },
        { kpiId: 'kpi-2', value: 50 },
      ])

      expect(results).toHaveLength(2)
      expect(results[0].kpiId).toBe('kpi-1')
      expect(results[0].error).toContain('not found')
      expect(results[1].kpiId).toBe('kpi-2')
      expect(results[1].error).toBeUndefined()
    })

    it('passes baseline to percent_change evaluation', async () => {
      mockedSupabase.getKPI.mockResolvedValue(mockKPI1)
      mockedSupabase.getKPIAlerts.mockResolvedValue([
        { id: 'alert-1', condition: 'percent_change', threshold: 20, active: true },
      ])
      mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })

      const results = await evaluateMultipleKPIs([
        { kpiId: 'kpi-1', value: 150, baseline: 100 }, // 50% change
      ])

      expect(results[0].triggeredAlerts).toHaveLength(1)
    })

    it('returns empty array for empty input', async () => {
      const results = await evaluateMultipleKPIs([])
      expect(results).toEqual([])
    })
  })

  // ============================================================
  // Alert message generation (tested via evaluateKPIAlerts)
  // ============================================================
  describe('alert message generation', () => {
    const mockKPI = { id: 'kpi-123', name: 'Spend' }

    beforeEach(() => {
      mockedSupabase.getKPI.mockResolvedValue(mockKPI)
      mockedSupabase.createAlertHistory.mockResolvedValue({ id: 'history-1' })
    })

    it('generates above_threshold message', async () => {
      mockedSupabase.getKPIAlerts.mockResolvedValue([
        { id: 'alert-1', condition: 'above_threshold', threshold: 1000, active: true },
      ])

      const result = await evaluateKPIAlerts('kpi-123', 1500)

      expect(result.triggeredAlerts[0].message).toContain('Spend')
      expect(result.triggeredAlerts[0].message).toContain('1500')
      expect(result.triggeredAlerts[0].message).toContain('exceeded')
      expect(result.triggeredAlerts[0].message).toContain('1000')
    })

    it('generates below_threshold message', async () => {
      mockedSupabase.getKPIAlerts.mockResolvedValue([
        { id: 'alert-1', condition: 'below_threshold', threshold: 100, active: true },
      ])

      const result = await evaluateKPIAlerts('kpi-123', 50)

      expect(result.triggeredAlerts[0].message).toContain('dropped below')
    })

    it('generates equals message', async () => {
      mockedSupabase.getKPIAlerts.mockResolvedValue([
        { id: 'alert-1', condition: 'equals', threshold: 100, active: true },
      ])

      const result = await evaluateKPIAlerts('kpi-123', 100)

      expect(result.triggeredAlerts[0].message).toContain('equals')
    })

    it('generates percent_change message', async () => {
      mockedSupabase.getKPIAlerts.mockResolvedValue([
        { id: 'alert-1', condition: 'percent_change', threshold: 20, active: true },
      ])

      const result = await evaluateKPIAlerts('kpi-123', 150, 100)

      expect(result.triggeredAlerts[0].message).toContain('changed by more than')
      expect(result.triggeredAlerts[0].message).toContain('20%')
    })
  })
})
